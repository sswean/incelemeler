import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type {
  ListingKind,
  ModerationReason,
  MyReview,
  PublicReview,
  ReviewBody,
  ReviewCreateBody,
  ReviewFormContext,
  ReviewList,
  ReviewListQuery,
  ReviewUpdateBody,
} from '@incelemeler/contracts';
import { listingPath } from '@incelemeler/routes';
import { type FieldError, ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import type { Prisma, Review } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthContext } from '../identity/auth.context.js';
import { OutboxService } from '../outbox/outbox.service.js';
import { RateLimitService } from '../platform/rate-limit.service.js';
import { toSummary } from './rating-stats.js';
import { assessReview } from './review-signals.js';
import { ModerationSettingsService } from './moderation-settings.service.js';

type Tx = Prisma.TransactionClient;
const PUBLIC_LISTING = ['PUBLISHED', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY'] as const;
const NO_LOCATION_KINDS: ListingKind[] = ['PRODUCT', 'WORK'];
export const APPEAL_WINDOW_DAYS = 14;
const PAGE_SIZE = 20;
const CAR_RENTAL = 'arac-kiralama';

const invalid = (errors: FieldError[]) =>
  new ProblemException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'VALIDATION_FAILED',
    'Değerlendirme kuralları sağlanmadı',
    undefined,
    errors,
  );
const fe = (pointer: string, code: string, message: string): FieldError => ({
  pointer,
  code,
  message,
});
const notFound = () =>
  new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Değerlendirme bulunamadı');

function websiteDomain(contacts: unknown): string | null {
  const url = (contacts as { website?: string } | null)?.website;
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Kullanıcı değerlendirmeleri (Ek A6.4, REQ-DEG-001…005, REQ-VER-006): yazma, düzenleme, geri çekme, liste.
 * Sıralama ve görünürlük ticari ilişkilerden bağımsızdır; olumsuz değerlendirme gizlenmez/aşağı itilmez.
 */
@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly rateLimit: RateLimitService,
    private readonly settings: ModerationSettingsService,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  async create(ctx: AuthContext, body: ReviewCreateBody, meta: RequestMeta): Promise<MyReview> {
    if (!ctx.emailVerified) {
      throw new ProblemException(
        HttpStatus.FORBIDDEN,
        'EMAIL_NOT_VERIFIED',
        'Değerlendirme yazmak için e-posta adresini doğrula',
      );
    }
    await this.assertNotRestricted(ctx.userId);
    await this.rateLimit.enforce(`review:user:${ctx.userId}`, 5, 3600);
    const listing = await this.loadListing(body.listingId);
    await this.validate(listing, body);
    const existing = await this.prisma.review.findFirst({
      where: {
        listingId: listing.id,
        userId: ctx.userId,
        status: { notIn: ['REMOVED', 'WITHDRAWN'] },
      },
      select: { id: true },
    });
    if (existing) {
      throw new ProblemException(
        HttpStatus.CONFLICT,
        'CONFLICT',
        'Bu yer için zaten bir değerlendirmen var',
        undefined,
        [fe('/listingId', 'review_exists', 'Mevcut değerlendirmeni düzenleyebilirsin')],
      );
    }
    const assessment = await this.assess(ctx, listing, body, meta, null);
    const now = new Date();
    const review = await this.prisma.$transaction(async (tx) => {
      const r = await tx.review.create({
        data: {
          listingId: listing.id,
          userId: ctx.userId,
          ...this.content(body),
          incentivized: body.declarations.incentivized,
          declaredAt: now,
          status: assessment.preModeration ? 'PENDING' : 'PUBLISHED',
          moderationMode: assessment.preModeration ? 'PRE' : 'POST',
          publishedAt: assessment.preModeration ? null : now,
          riskScore: assessment.riskScore,
          signals: assessment.signals as unknown as Prisma.InputJsonArray,
          language: body.language,
          ipPrefix: meta.ipPrefix,
        },
      });
      await tx.reviewDraft.deleteMany({ where: { userId: ctx.userId, listingId: listing.id } });
      await this.changed(tx, r, null);
      return r;
    });
    return this.toMine(review);
  }

  async update(
    ctx: AuthContext,
    id: string,
    body: ReviewUpdateBody,
    meta: RequestMeta,
  ): Promise<MyReview> {
    const current = await this.prisma.review.findUnique({ where: { id } });
    if (!current || current.userId !== ctx.userId) throw notFound();
    if (!['PENDING', 'PUBLISHED', 'REJECTED'].includes(current.status)) {
      throw new ProblemException(HttpStatus.CONFLICT, 'CONFLICT', 'Bu değerlendirme düzenlenemez');
    }
    if (current.version !== body.version) throw versionConflict();
    await this.assertNotRestricted(ctx.userId);
    await this.rateLimit.enforce(`review:edit:${ctx.userId}`, 20, 3600);
    const listing = await this.loadListing(current.listingId);
    await this.validate(listing, body);
    const assessment = await this.assess(ctx, listing, body, meta, current.id);
    const now = new Date();
    // Reddedilen yeniden gönderilir; yayındaki düzenleme yeniden değerlendirilir (risk varsa yayından çekilir).
    const pre = current.status !== 'PUBLISHED' || assessment.preModeration;
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.reviewRevision.create({
        data: {
          reviewId: current.id,
          rating: current.rating,
          title: current.title,
          body: current.body,
          criteriaRatings: current.criteriaRatings as Prisma.InputJsonArray,
        },
      });
      const res = await tx.review.updateMany({
        where: { id, version: current.version },
        data: {
          ...this.content(body),
          incentivized: body.declarations.incentivized,
          declaredAt: now,
          status: pre ? 'PENDING' : 'PUBLISHED',
          moderationMode: pre ? 'PRE' : 'POST',
          reviewedAt: null,
          submittedAt: current.status === 'REJECTED' ? now : current.submittedAt,
          editedAt: current.publishedAt ? now : null,
          riskScore: assessment.riskScore,
          signals: assessment.signals as unknown as Prisma.InputJsonArray,
          reasonCode: null,
          reasonNote: null,
          version: { increment: 1 },
        },
      });
      if (res.count === 0) throw versionConflict();
      const r = await tx.review.findUniqueOrThrow({ where: { id } });
      await this.changed(tx, r, current.status);
      return r;
    });
    return this.toMine(updated);
  }

  async withdraw(ctx: AuthContext, id: string): Promise<MyReview> {
    const current = await this.prisma.review.findUnique({ where: { id } });
    if (!current || current.userId !== ctx.userId) throw notFound();
    if (['REMOVED', 'WITHDRAWN'].includes(current.status)) return this.toMine(current);
    const updated = await this.prisma.$transaction(async (tx) => {
      const r = await tx.review.update({
        where: { id },
        data: {
          status: 'WITHDRAWN',
          reasonCode: 'USER_REQUEST' satisfies ModerationReason,
          version: { increment: 1 },
        },
      });
      await this.changed(tx, r, current.status);
      return r;
    });
    return this.toMine(updated);
  }

  async mine(ctx: AuthContext): Promise<{ data: MyReview[] }> {
    const rows = await this.prisma.review.findMany({
      where: { userId: ctx.userId, status: { not: 'WITHDRAWN' } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return { data: await Promise.all(rows.map((r) => this.toMine(r))) };
  }

  async getDraft(ctx: AuthContext, listingId: string) {
    const d = await this.prisma.reviewDraft.findUnique({
      where: { userId_listingId: { userId: ctx.userId, listingId } },
    });
    if (!d) throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Taslak yok');
    return {
      listingId,
      data: d.data as Record<string, unknown>,
      updatedAt: d.updatedAt.toISOString(),
    };
  }

  async saveDraft(ctx: AuthContext, listingId: string, data: Record<string, unknown>) {
    await this.loadListing(listingId);
    const d = await this.prisma.reviewDraft.upsert({
      where: { userId_listingId: { userId: ctx.userId, listingId } },
      create: { userId: ctx.userId, listingId, data: data as Prisma.InputJsonObject },
      update: { data: data as Prisma.InputJsonObject },
    });
    return {
      listingId,
      data: d.data as Record<string, unknown>,
      updatedAt: d.updatedAt.toISOString(),
    };
  }

  async formContext(listingId: string): Promise<ReviewFormContext> {
    const l = await this.loadListing(listingId);
    const chain = [
      l.primaryCategory,
      l.primaryCategory.parent,
      l.primaryCategory.parent?.parent,
    ].filter((c): c is NonNullable<typeof c> => !!c);
    const criteria = await this.prisma.reviewCriterion.findMany({
      where: { categoryId: { in: chain.map((c) => c.id) }, archivedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const kind = l.kind as ListingKind;
    const c = l.primaryCategory;
    const carRental =
      kind === 'SERVICE_PROVIDER' &&
      [c.slug, c.parent?.slug, c.parent?.parent?.slug].includes(CAR_RENTAL);
    return {
      listing: {
        id: l.id,
        name: l.name,
        kind,
        path: listingPath({ kind, slug: l.slug, carRental }),
      },
      // Alt kategoride yeniden tanımlanan aynı anahtar üsttekini gölgeler (en fazla 6 — A6.3).
      criteria: [...new Map(criteria.map((x) => [x.key, x])).values()]
        .slice(0, 6)
        .map((x) => ({ id: x.id, name: x.name, description: x.description })),
      usesDuration: NO_LOCATION_KINDS.includes(kind),
      requiresVisitContext: kind === 'LODGING',
      ugcEnabled: chain.every((x) => x.ugcEnabled),
    };
  }

  /** Herkese açık liste (REQ-DEG-002/003): varsayılan en yeni; olumsuzlar gizlenmez; ticari sinyal yok. */
  async listForListing(listingId: string, q: ReviewListQuery): Promise<ReviewList> {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        deletedAt: null,
        status: { in: [...PUBLIC_LISTING] },
        ...(this.env.APP_ENV === 'production' ? { dataOrigin: { not: 'DEMO' } } : {}),
      },
      include: { ratingStats: true },
    });
    if (!listing)
      throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Listeleme bulunamadı');
    const where: Prisma.ReviewWhereInput = {
      listingId,
      status: 'PUBLISHED',
      ...(q.rating ? { rating: q.rating } : {}),
      ...(q.visitContext ? { visitContext: q.visitContext } : {}),
      ...(q.documented || q.sort === 'documented'
        ? { verification: { in: ['DOCUMENTED', 'PROVIDER_VERIFIED'] } }
        : {}),
    };
    const orderBy: Prisma.ReviewOrderByWithRelationInput[] =
      q.sort === 'highest'
        ? [{ rating: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }]
        : q.sort === 'lowest'
          ? [{ rating: 'asc' }, { publishedAt: 'desc' }, { id: 'desc' }]
          : [{ publishedAt: 'desc' }, { id: 'desc' }];
    const [total, rows, criteria] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        orderBy,
        skip: (q.page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { user: { select: { displayName: true } } },
      }),
      this.prisma.reviewCriterion.findMany({ select: { id: true, name: true } }),
    ]);
    const names = new Map(criteria.map((c) => [c.id, c.name]));
    const s = listing.ratingStats;
    return {
      summary: toSummary(
        s
          ? {
              count: s.count,
              average: s.average === null ? null : Number(s.average),
              distribution: s.distribution as [number, number, number, number, number],
              criteria: s.criteria as Array<{
                criterionId: string;
                name: string;
                average: number;
                count: number;
              }>,
              last12Count: s.last12Count,
              last12Avg: s.last12Avg === null ? null : Number(s.last12Avg),
            }
          : null,
        listing.kind as ListingKind,
      ),
      data: rows.map((r): PublicReview => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        criteriaRatings: (r.criteriaRatings as Array<{ criterionId: string; rating: number }>)
          .filter((c) => names.has(c.criterionId))
          .map((c) => ({ name: names.get(c.criterionId)!, rating: c.rating })),
        experienceMonth: r.experienceMonth,
        usageDuration: r.usageDuration as PublicReview['usageDuration'],
        visitContext: r.visitContext as PublicReview['visitContext'],
        verification: r.verification,
        incentivized: r.incentivized,
        author: { displayName: r.user.displayName },
        publishedAt: r.publishedAt!.toISOString(),
        editedAt: r.editedAt?.toISOString() ?? null,
      })),
      total,
      page: q.page,
      pageSize: PAGE_SIZE,
    };
  }

  async toMine(r: Review): Promise<MyReview> {
    const [listing, reported, appeal] = await Promise.all([
      this.prisma.listing.findUniqueOrThrow({
        where: { id: r.listingId },
        include: { primaryCategory: { include: { parent: { include: { parent: true } } } } },
      }),
      this.prisma.contentReport.count({
        where: { targetType: 'REVIEW', targetId: r.id, status: 'OPEN' },
      }),
      this.prisma.moderationAppeal.findFirst({ where: { reviewId: r.id, appellantId: r.userId } }),
    ]);
    const c = listing.primaryCategory;
    const carRental =
      listing.kind === 'SERVICE_PROVIDER' &&
      [c.slug, c.parent?.slug, c.parent?.parent?.slug].includes(CAR_RENTAL);
    const deadline =
      r.moderatedAt && ['REJECTED', 'REMOVED'].includes(r.status)
        ? new Date(r.moderatedAt.getTime() + APPEAL_WINDOW_DAYS * 86_400_000)
        : null;
    return {
      id: r.id,
      listing: {
        id: listing.id,
        name: listing.name,
        path: listingPath({ kind: listing.kind as ListingKind, slug: listing.slug, carRental }),
      },
      rating: r.rating,
      title: r.title,
      body: r.body,
      status: r.status,
      reported: r.status === 'PUBLISHED' && reported > 0,
      reasonCode: r.reasonCode as MyReview['reasonCode'],
      reasonNote: r.reasonNote,
      appeal: appeal
        ? appeal.status
        : deadline && r.moderatedById && deadline > new Date() && r.reasonCode !== 'USER_REQUEST'
          ? 'AVAILABLE'
          : 'NONE',
      appealDeadline: deadline && !appeal ? deadline.toISOString() : null,
      incentivized: r.incentivized,
      criteriaRatings: r.criteriaRatings as MyReview['criteriaRatings'],
      experienceMonth: r.experienceMonth,
      usageDuration: r.usageDuration as MyReview['usageDuration'],
      visitContext: r.visitContext as MyReview['visitContext'],
      createdAt: r.createdAt.toISOString(),
      editedAt: r.editedAt?.toISOString() ?? null,
      version: r.version,
    };
  }

  /** Durum değişikliği: puan istatistiği + arama + bildirim outbox ile (aynı işlemde). */
  /** Etkin değerlendirme kısıtı (yaptırım basamağı — REQ-GUN-007) varsa yeni değerlendirme yazılamaz. */
  async assertNotRestricted(userId: string): Promise<void> {
    const now = new Date();
    const restricted = await this.prisma.accountSanction.count({
      where: {
        userId,
        revokedAt: null,
        level: { in: ['REVIEW_RESTRICTION', 'SUSPENSION', 'PERMANENT_BAN'] },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
    });
    if (restricted) {
      throw new ProblemException(
        HttpStatus.FORBIDDEN,
        'ACCOUNT_RESTRICTED',
        'Değerlendirme yazma hakkın geçici olarak kısıtlandı',
      );
    }
  }

  async changed(tx: Tx, r: Review, from: string | null): Promise<void> {
    await this.outbox.enqueue(tx, {
      type: 'reviews.review.changed',
      aggregateType: 'review',
      aggregateId: r.id,
      payload: { listingId: r.listingId, from, to: r.status },
    });
  }

  private content(body: ReviewBody) {
    return {
      rating: body.rating,
      title: body.title?.trim() || null,
      body: body.body,
      criteriaRatings: body.criteriaRatings as Prisma.InputJsonArray,
      experienceMonth: body.experienceMonth ?? null,
      usageDuration: body.usageDuration ?? null,
      visitContext: body.visitContext ?? null,
    };
  }

  private async loadListing(id: string) {
    const l = await this.prisma.listing.findFirst({
      where: {
        id,
        deletedAt: null,
        status: { in: [...PUBLIC_LISTING] },
        ...(this.env.APP_ENV === 'production' ? { dataOrigin: { not: 'DEMO' } } : {}),
      },
      include: { primaryCategory: { include: { parent: { include: { parent: true } } } } },
    });
    if (!l) throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Listeleme bulunamadı');
    return l;
  }

  /** Tür kuralları (A6.3) ve kategori kriterleri; gelecek tarihli deneyim yok. */
  private async validate(
    listing: Awaited<ReturnType<ReviewsService['loadListing']>>,
    body: ReviewBody,
  ) {
    const chain = [
      listing.primaryCategory,
      listing.primaryCategory.parent,
      listing.primaryCategory.parent?.parent,
    ].filter((c): c is NonNullable<typeof c> => !!c);
    const errors: FieldError[] = [];
    if (chain.some((c) => !c.ugcEnabled)) {
      errors.push(
        fe('/listingId', 'ugc_disabled', 'Bu kategoride kullanıcı değerlendirmesi kapalı'),
      );
    }
    const kind = listing.kind as ListingKind;
    if (NO_LOCATION_KINDS.includes(kind)) {
      if (!body.usageDuration)
        errors.push(fe('/usageDuration', 'required', 'Kullanım süresini seç'));
    } else {
      if (!body.experienceMonth) {
        errors.push(fe('/experienceMonth', 'required', 'Deneyim ayını ve yılını seç'));
      } else if (body.experienceMonth > new Date().toISOString().slice(0, 7)) {
        errors.push(fe('/experienceMonth', 'future', 'Gelecek tarihli deneyim olamaz'));
      }
    }
    if (kind === 'LODGING' && !body.visitContext) {
      errors.push(fe('/visitContext', 'required', 'Yolculuk türünü seç'));
    }
    if (body.criteriaRatings.length) {
      const allowed = await this.prisma.reviewCriterion.findMany({
        where: { categoryId: { in: chain.map((c) => c.id) }, archivedAt: null },
        select: { id: true },
      });
      const ids = new Set(allowed.map((a) => a.id));
      const seen = new Set<string>();
      body.criteriaRatings.forEach((c, i) => {
        if (!ids.has(c.criterionId) || seen.has(c.criterionId)) {
          errors.push(
            fe(
              `/criteriaRatings/${i}/criterionId`,
              'invalid',
              'Bu kriter bu yer için geçerli değil',
            ),
          );
        }
        seen.add(c.criterionId);
      });
    }
    if (errors.length) throw invalid(errors);
  }

  private async assess(
    ctx: AuthContext,
    listing: Awaited<ReturnType<ReviewsService['loadListing']>>,
    body: ReviewBody,
    meta: RequestMeta,
    selfId: string | null,
  ) {
    const dayAgo = new Date(Date.now() - 86_400_000);
    const text = `${body.title ?? ''} ${body.body}`;
    const [user, approved, byUser, byIp, wave, sim, cfg] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: ctx.userId } }),
      this.prisma.review.count({
        where: {
          userId: ctx.userId,
          status: 'PUBLISHED',
          ...(selfId ? { id: { not: selfId } } : {}),
        },
      }),
      this.prisma.review.count({
        where: {
          userId: ctx.userId,
          createdAt: { gte: dayAgo },
          ...(selfId ? { id: { not: selfId } } : {}),
        },
      }),
      meta.ipPrefix
        ? this.prisma.review.count({
            where: { ipPrefix: meta.ipPrefix, createdAt: { gte: dayAgo } },
          })
        : Promise.resolve(0),
      this.prisma.review.count({ where: { listingId: listing.id, createdAt: { gte: dayAgo } } }),
      this.prisma.$queryRaw<Array<{ s: number | null }>>`
        SELECT max(similarity(body, ${text})) AS s FROM reviews
        WHERE (user_id = ${ctx.userId}::uuid OR listing_id = ${listing.id}::uuid)
          AND id <> ${selfId ?? '00000000-0000-0000-0000-000000000000'}::uuid
          AND created_at > now() - interval '180 days'`,
      this.settings.get(),
    ]);
    const chain = [
      listing.primaryCategory,
      listing.primaryCategory.parent,
      listing.primaryCategory.parent?.parent,
    ];
    return assessReview(
      {
        title: body.title ?? null,
        body: body.body,
        accountAgeDays: (Date.now() - user.createdAt.getTime()) / 86_400_000,
        approvedReviewCount: approved,
        recentByUser24h: byUser,
        recentByIp24h: byIp,
        listingReviews24h: wave,
        maxSimilarity: Number(sim[0]?.s ?? 0),
        userEmailDomain: user.email.split('@')[1] ?? '',
        listingWebsiteDomain: websiteDomain(listing.contacts),
        ymyl: chain.some((c) => c?.ymyl),
      },
      cfg,
    );
  }
}

const versionConflict = () =>
  new ProblemException(
    HttpStatus.PRECONDITION_FAILED,
    'PRECONDITION_FAILED',
    'Değerlendirme başka bir oturumda değiştirildi',
  );
