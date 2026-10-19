import { HttpStatus, Injectable } from '@nestjs/common';
import type { z } from 'zod';
import type {
  AppealCreateBody,
  AppealDecisionBody,
  ModerationQueue,
  ModerationReason,
  ReportCreateBody,
  ReportDecisionBody,
  ReviewDecisionBody,
} from '@incelemeler/contracts';
import { type FieldError, ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import type { Prisma, Review } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthContext } from '../identity/auth.context.js';
import { OutboxService } from '../outbox/outbox.service.js';
import { AuditService } from '../platform/audit.service.js';
import { RateLimitService } from '../platform/rate-limit.service.js';
import { APPEAL_WINDOW_DAYS, ReviewsService } from './reviews.service.js';

type Tx = Prisma.TransactionClient;
const DAY = 86_400_000;

const forbidden = (code: string, title: string) =>
  new ProblemException(HttpStatus.FORBIDDEN, 'FORBIDDEN', title, undefined, [
    { pointer: '', code, message: title },
  ]);
const invalid = (errors: FieldError[]) =>
  new ProblemException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'VALIDATION_FAILED',
    'Karar kuralları sağlanmadı',
    undefined,
    errors,
  );
const conflict = (title: string) => new ProblemException(HttpStatus.CONFLICT, 'CONFLICT', title);
const notFound = () => new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Kayıt bulunamadı');

/**
 * Moderasyon (REQ-GUN-001…004, 009): kuyruk, gerekçe kodlu kararlar, bildir, itiraz.
 * Kaldırma yalnızca politika ihlali, hukuki talep/karar ya da kullanıcı talebiyle olur; "işletme beğenmedi"
 * gerekçe kodu yoktur. Moderatör kendi değerlendirmesini modere edemez; itirazı ilk kararı veren inceleyemez.
 */
@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly audit: AuditService,
    private readonly rateLimit: RateLimitService,
    private readonly reviews: ReviewsService,
  ) {}

  async queue(queue: 'pending' | 'post' | 'reports' | 'appeals'): Promise<ModerationQueue> {
    const include = {
      user: { select: { id: true, displayName: true } },
      listing: { select: { id: true, name: true } },
    } satisfies Prisma.ReviewInclude;
    type R = Prisma.ReviewGetPayload<{ include: typeof include }>;
    const reviewDto = (r: R) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      status: r.status,
      riskScore: r.riskScore,
      signals: r.signals as Array<{ code: string; weight: number; detail: string | null }>,
      incentivized: r.incentivized,
      author: { id: r.user.id, displayName: r.user.displayName },
      listing: { id: r.listing.id, name: r.listing.name },
      version: r.version,
      createdAt: r.createdAt.toISOString(),
      moderatedById: r.moderatedById,
      reasonCode: r.reasonCode as ModerationReason | null,
    });
    const age = (d: Date) => Math.round(((Date.now() - d.getTime()) / 3_600_000) * 10) / 10;
    const counts = {
      pending: await this.prisma.review.count({ where: { status: 'PENDING' } }),
      post: await this.prisma.review.count({
        where: { status: 'PUBLISHED', moderationMode: 'POST', reviewedAt: null },
      }),
      reports: await this.prisma.contentReport.count({ where: { status: 'OPEN' } }),
      appeals: await this.prisma.moderationAppeal.count({ where: { status: 'OPEN' } }),
    };
    let data: ModerationQueue['data'] = [];
    if (queue === 'pending' || queue === 'post') {
      const rows = await this.prisma.review.findMany({
        where:
          queue === 'pending'
            ? { status: 'PENDING' }
            : { status: 'PUBLISHED', moderationMode: 'POST', reviewedAt: null },
        include,
        orderBy: [{ riskScore: 'desc' }, { submittedAt: 'asc' }],
        take: 100,
      });
      data = rows.map((r) => ({
        kind: 'REVIEW' as const,
        id: r.id,
        review: reviewDto(r),
        report: null,
        appeal: null,
        ageHours: age(r.submittedAt),
        priority: r.riskScore,
      }));
    } else if (queue === 'reports') {
      const reports = await this.prisma.contentReport.findMany({
        where: { status: 'OPEN', targetType: 'REVIEW' },
        orderBy: { createdAt: 'asc' },
        take: 300,
      });
      const byTarget = new Map<string, typeof reports>();
      for (const r of reports) byTarget.set(r.targetId, [...(byTarget.get(r.targetId) ?? []), r]);
      const reviews = await this.prisma.review.findMany({
        where: { id: { in: [...byTarget.keys()] } },
        include,
      });
      data = reviews
        .map((rv) => {
          const rs = byTarget.get(rv.id)!;
          const legal = rs.some((x) => x.reason === 'LEGAL');
          return {
            kind: 'REPORT' as const,
            id: rs[0]!.id,
            review: reviewDto(rv),
            report: {
              reason: rs[0]!.reason as never,
              description: rs[0]!.description,
              count: rs.length,
            },
            appeal: null,
            ageHours: age(rs[0]!.createdAt),
            // Öncelik: hukuki talep, bildirim sayısı, risk (REQ-GUN-001).
            priority: (legal ? 1000 : 0) + rs.length * 10 + rv.riskScore,
          };
        })
        .sort((a, b) => b.priority - a.priority || b.ageHours - a.ageHours);
    } else {
      const appeals = await this.prisma.moderationAppeal.findMany({
        where: { status: 'OPEN' },
        include: { review: { include }, report: true },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });
      for (const a of appeals) {
        const review =
          a.review ??
          (a.report
            ? await this.prisma.review.findUnique({ where: { id: a.report.targetId }, include })
            : null);
        if (!review) continue;
        data.push({
          kind: 'APPEAL',
          id: a.id,
          review: reviewDto(review),
          report: null,
          appeal: {
            statement: a.statement,
            against: a.reviewId ? 'REVIEW_DECISION' : 'REPORT_DECISION',
          },
          ageHours: age(a.createdAt),
          priority: 0,
        });
      }
    }
    return { data, counts };
  }

  async decideReview(
    ctx: AuthContext,
    id: string,
    body: z.infer<typeof ReviewDecisionBody>,
    meta: RequestMeta,
  ): Promise<{ ok: true }> {
    const r = await this.prisma.review.findUnique({ where: { id } });
    if (!r) throw notFound();
    this.assertNoConflict(ctx, r);
    if (r.version !== body.version) {
      throw new ProblemException(
        HttpStatus.PRECONDITION_FAILED,
        'PRECONDITION_FAILED',
        'Değerlendirme değişti',
      );
    }
    if (body.action !== 'APPROVE' && !body.reasonCode) {
      throw invalid([
        { pointer: '/reasonCode', code: 'required', message: 'Gerekçe kodu zorunlu' },
      ]);
    }
    const now = new Date();
    let data: Prisma.ReviewUpdateInput;
    if (body.action === 'APPROVE') {
      if (r.status === 'PENDING')
        data = { status: 'PUBLISHED', publishedAt: r.publishedAt ?? now, reviewedAt: now };
      else if (r.status === 'PUBLISHED') data = { reviewedAt: now };
      else throw conflict('Bu durumdaki değerlendirme onaylanamaz');
    } else if (body.action === 'REJECT') {
      if (r.status !== 'PENDING') throw conflict('Yalnızca incelemedeki değerlendirme reddedilir');
      data = { status: 'REJECTED' };
    } else {
      if (!['PUBLISHED', 'PENDING'].includes(r.status))
        throw conflict('Bu değerlendirme kaldırılamaz');
      data = { status: 'REMOVED' };
    }
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id },
        data: {
          ...data,
          ...(body.action === 'APPROVE' && r.status === 'PUBLISHED'
            ? {}
            : {
                reasonCode: body.reasonCode ?? null,
                reasonNote: body.note ?? null,
                moderatedBy: { connect: { id: ctx.userId } },
                moderatedAt: now,
              }),
          version: { increment: 1 },
        },
      });
      if (body.action === 'REMOVE')
        await this.closeReports(tx, ctx, id, 'UPHELD', body.reasonCode!, body.note);
      await this.record(
        tx,
        ctx,
        `moderation.review.${body.action.toLowerCase()}`,
        'review',
        id,
        meta,
        {
          from: r.status,
          to: updated.status,
          reasonCode: body.reasonCode ?? null,
        },
      );
      await this.reviews.changed(tx, updated, r.status);
    });
    return { ok: true };
  }

  async report(
    ctx: AuthContext | null,
    body: z.infer<typeof ReportCreateBody>,
    meta: RequestMeta,
  ): Promise<{ id: string; status: 'OPEN' }> {
    // Misafir de bildirebilir; hız sınırlı (REQ-GUN-002, REQ-GUN-008).
    await this.rateLimit.enforce(
      ctx ? `report:user:${ctx.userId}` : `report:ip:${meta.ipPrefix ?? meta.ip}`,
      ctx ? 20 : 5,
      3600,
    );
    const review = await this.prisma.review.findFirst({
      where: { id: body.targetId, status: 'PUBLISHED' },
    });
    if (!review) throw notFound();
    if (ctx) {
      const dup = await this.prisma.contentReport.findFirst({
        where: { targetId: body.targetId, reporterId: ctx.userId, status: 'OPEN' },
      });
      if (dup) return { id: dup.id, status: 'OPEN' };
    }
    const r = await this.prisma.contentReport.create({
      data: {
        targetType: body.targetType,
        targetId: body.targetId,
        reason: body.reason,
        description: body.description ?? null,
        reporterId: ctx?.userId ?? null,
        reporterEmail: ctx ? null : (body.email?.toLowerCase() ?? null),
        ipPrefix: meta.ipPrefix,
      },
    });
    return { id: r.id, status: 'OPEN' };
  }

  async decideReport(
    ctx: AuthContext,
    id: string,
    body: z.infer<typeof ReportDecisionBody>,
    meta: RequestMeta,
  ): Promise<{ ok: true }> {
    const report = await this.prisma.contentReport.findUnique({ where: { id } });
    if (!report || report.status !== 'OPEN') throw notFound();
    const review = await this.prisma.review.findUniqueOrThrow({ where: { id: report.targetId } });
    this.assertNoConflict(ctx, review);
    if (body.action === 'REMOVE_TARGET' && !body.reasonCode) {
      throw invalid([
        { pointer: '/reasonCode', code: 'required', message: 'Gerekçe kodu zorunlu' },
      ]);
    }
    await this.prisma.$transaction(async (tx) => {
      if (body.action === 'DISMISS') {
        await tx.contentReport.update({
          where: { id },
          data: {
            status: 'DISMISSED',
            decidedById: ctx.userId,
            decidedAt: new Date(),
            note: body.note ?? null,
          },
        });
        await this.outbox.enqueue(tx, {
          type: 'reviews.report.decided',
          aggregateType: 'report',
          aggregateId: id,
        });
      } else {
        if (review.status !== 'PUBLISHED') throw conflict('İçerik zaten yayında değil');
        const updated = await tx.review.update({
          where: { id: review.id },
          data: {
            status: 'REMOVED',
            reasonCode: body.reasonCode!,
            reasonNote: body.note ?? null,
            moderatedById: ctx.userId,
            moderatedAt: new Date(),
            version: { increment: 1 },
          },
        });
        await this.closeReports(tx, ctx, review.id, 'UPHELD', body.reasonCode!, body.note);
        await this.reviews.changed(tx, updated, review.status);
      }
      await this.record(
        tx,
        ctx,
        `moderation.report.${body.action.toLowerCase()}`,
        'report',
        id,
        meta,
        {
          reviewId: review.id,
          reasonCode: body.reasonCode ?? null,
        },
      );
    });
    return { ok: true };
  }

  async appeal(
    ctx: AuthContext,
    body: z.infer<typeof AppealCreateBody>,
  ): Promise<{ id: string; status: 'OPEN' }> {
    const deadline = (d: Date | null) =>
      !!d && Date.now() - d.getTime() <= APPEAL_WINDOW_DAYS * DAY;
    let data: Prisma.ModerationAppealUncheckedCreateInput;
    if (body.reviewId) {
      const r = await this.prisma.review.findUnique({ where: { id: body.reviewId } });
      if (!r || r.userId !== ctx.userId) throw notFound();
      if (
        !['REJECTED', 'REMOVED'].includes(r.status) ||
        !r.moderatedById ||
        r.reasonCode === 'USER_REQUEST'
      ) {
        throw conflict('Bu karar için itiraz edilemez');
      }
      if (!deadline(r.moderatedAt)) throw conflict('İtiraz süresi (14 gün) doldu');
      data = {
        reviewId: r.id,
        appellantId: ctx.userId,
        statement: body.statement,
        originalDeciderId: r.moderatedById,
      };
    } else {
      const rep = await this.prisma.contentReport.findUnique({ where: { id: body.reportId! } });
      if (!rep || rep.reporterId !== ctx.userId) throw notFound();
      if (rep.status !== 'DISMISSED' || !rep.decidedById)
        throw conflict('Bu karar için itiraz edilemez');
      if (!deadline(rep.decidedAt)) throw conflict('İtiraz süresi (14 gün) doldu');
      data = {
        reportId: rep.id,
        appellantId: ctx.userId,
        statement: body.statement,
        originalDeciderId: rep.decidedById,
      };
    }
    try {
      const a = await this.prisma.moderationAppeal.create({ data });
      return { id: a.id, status: 'OPEN' };
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002') throw conflict('Bu karara zaten itiraz ettin');
      throw e;
    }
  }

  async decideAppeal(
    ctx: AuthContext,
    id: string,
    body: z.infer<typeof AppealDecisionBody>,
    meta: RequestMeta,
  ): Promise<{ ok: true }> {
    const a = await this.prisma.moderationAppeal.findUnique({
      where: { id },
      include: { report: true },
    });
    if (!a || a.status !== 'OPEN') throw notFound();
    if (a.originalDeciderId === ctx.userId) {
      throw forbidden('same_moderator', 'İtirazı ilk kararı veren moderatör inceleyemez');
    }
    const reviewId = a.reviewId ?? a.report!.targetId;
    const review = await this.prisma.review.findUniqueOrThrow({ where: { id: reviewId } });
    this.assertNoConflict(ctx, review);
    if (body.outcome === 'OVERTURNED' && a.reportId && !body.reasonCode) {
      throw invalid([
        { pointer: '/reasonCode', code: 'required', message: 'Kaldırma için gerekçe kodu zorunlu' },
      ]);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.moderationAppeal.update({
        where: { id },
        data: {
          status: body.outcome,
          decidedById: ctx.userId,
          decidedAt: new Date(),
          note: body.note,
        },
      });
      if (body.outcome === 'OVERTURNED') {
        const now = new Date();
        const updated = a.reviewId
          ? // Değerlendirme sahibinin itirazı kabul: yeniden yayına.
            await tx.review.update({
              where: { id: reviewId },
              data: {
                status: 'PUBLISHED',
                publishedAt: review.publishedAt ?? now,
                reviewedAt: now,
                reasonCode: null,
                reasonNote: null,
                version: { increment: 1 },
              },
            })
          : // Bildirim sahibinin itirazı kabul: içerik kaldırılır.
            await tx.review.update({
              where: { id: reviewId },
              data: {
                status: 'REMOVED',
                reasonCode: body.reasonCode!,
                reasonNote: body.note,
                moderatedById: ctx.userId,
                moderatedAt: now,
                version: { increment: 1 },
              },
            });
        if (a.reportId) {
          await tx.contentReport.update({ where: { id: a.reportId }, data: { status: 'UPHELD' } });
        }
        await this.reviews.changed(tx, updated, review.status);
      }
      await this.outbox.enqueue(tx, {
        type: 'reviews.appeal.decided',
        aggregateType: 'appeal',
        aggregateId: id,
      });
      await this.record(tx, ctx, 'moderation.appeal.decided', 'appeal', id, meta, {
        outcome: body.outcome,
        reviewId,
      });
    });
    return { ok: true };
  }

  /** REQ-GUN-009: moderatör kendi değerlendirmesini modere edemez. */
  private assertNoConflict(ctx: AuthContext, r: Pick<Review, 'userId'>) {
    if (r.userId === ctx.userId) {
      throw forbidden('conflict_of_interest', 'Kendi değerlendirmeni modere edemezsin');
    }
  }

  private async closeReports(
    tx: Tx,
    ctx: AuthContext,
    reviewId: string,
    status: 'UPHELD' | 'DISMISSED',
    reasonCode: string,
    note: string | null | undefined,
  ) {
    const open = await tx.contentReport.findMany({
      where: { targetType: 'REVIEW', targetId: reviewId, status: 'OPEN' },
      select: { id: true },
    });
    for (const o of open) {
      await tx.contentReport.update({
        where: { id: o.id },
        data: {
          status,
          decidedById: ctx.userId,
          decidedAt: new Date(),
          reasonCode,
          note: note ?? null,
        },
      });
      await this.outbox.enqueue(tx, {
        type: 'reviews.report.decided',
        aggregateType: 'report',
        aggregateId: o.id,
      });
    }
  }

  private record(
    tx: Tx,
    ctx: AuthContext,
    action: string,
    targetType: string,
    targetId: string,
    meta: RequestMeta,
    summary: Prisma.InputJsonObject,
  ) {
    return this.audit.record(
      {
        actorId: ctx.userId,
        actorRole: ctx.roles.join(','),
        action,
        targetType,
        targetId,
        summary,
        ipPrefix: meta.ipPrefix,
        traceId: meta.traceId,
      },
      tx,
    );
  }
}
