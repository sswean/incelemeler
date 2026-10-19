import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  type AdminSanction,
  nextSanctionLevel,
  type SanctionCreateBody,
  type SanctionLevel,
  type SanctionReason,
  TIMED_LEVELS,
} from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { formatLongDate } from '@incelemeler/utils';
import { ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import { signToken, verifyToken } from '../../common/signed-token.js';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import type { AccountSanction, Prisma, User } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthContext } from '../identity/auth.context.js';
import { assertFreshStepUp } from '../identity/auth.guard.js';
import { EMAIL_PORT, type EmailPort } from '../notifications/email.port.js';
import { sanctionEmails } from '../notifications/email-templates.js';
import { AuditService } from '../platform/audit.service.js';
import { ReviewsService } from './reviews.service.js';

type Tx = Prisma.TransactionClient;
const DAY = 86_400_000;
const APPEAL_WINDOW = 14 * DAY;
const APPEAL_PURPOSE = 'sanction-appeal';
/** Basamak önerisi için geriye bakış (A-030). */
const HISTORY_DAYS = 365;
/** Bütünlük bildiriminin listelemede görünme süresi (A-030). */
export const INTEGRITY_NOTICE_DAYS = 180;
const T = tr.sanctions;
const BLOCKING: SanctionLevel[] = ['SUSPENSION', 'PERMANENT_BAN'];

const problem = (status: HttpStatus, code: 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN', title: string) =>
  new ProblemException(status, code, title);
const notFound = () => problem(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Kayıt bulunamadı');
const stale = () =>
  new ProblemException(HttpStatus.PRECONDITION_FAILED, 'PRECONDITION_FAILED', 'Kayıt değişti');
const invalid = (pointer: string, code: string, message: string) =>
  new ProblemException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'VALIDATION_FAILED',
    'Yaptırım kuralları sağlanmadı',
    undefined,
    [{ pointer, code, message }],
  );

function isActive(s: Pick<AccountSanction, 'revokedAt' | 'endsAt' | 'level'>, now = new Date()) {
  if (s.revokedAt) return false;
  return s.endsAt ? s.endsAt > now : s.level !== 'WARNING';
}

/**
 * Hesap yaptırım basamakları ve toplu sahte değerlendirme temizliği (REQ-GUN-007). Askı ve kalıcı kapatma
 * kullanıcı durumunu SUSPENDED yapar ve oturumları kapatır; süresi dolan askı girişte ya da işçide kalkar.
 */
@Injectable()
export class SanctionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly reviews: ReviewsService,
    @Inject(EMAIL_PORT) private readonly email: EmailPort,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  async list() {
    const include = { user: true } as const;
    const now = new Date();
    const [open, appeals] = await Promise.all([
      this.prisma.accountSanction.findMany({
        where: {
          revokedAt: null,
          level: { not: 'WARNING' },
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
        include,
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.prisma.accountSanction.findMany({
        where: { appealedAt: { not: null }, appealOutcome: null },
        include,
        orderBy: { appealedAt: 'asc' },
        take: 200,
      }),
    ]);
    return { active: open.map((s) => this.dto(s)), appeals: appeals.map((s) => this.dto(s)) };
  }

  async issue(ctx: AuthContext, body: SanctionCreateBody, meta: RequestMeta) {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: { roles: true },
    });
    if (!user || user.status === 'DELETED') throw notFound();
    if (user.id === ctx.userId) {
      throw problem(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'Kendine yaptırım uygulayamazsın');
    }
    if (user.roles.length) {
      throw problem(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'Personel hesapları bu akışla yaptırılamaz');
    }
    if (body.level === 'PERMANENT_BAN') assertFreshStepUp(ctx);
    const history = await this.prisma.accountSanction.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - HISTORY_DAYS * DAY) },
        OR: [{ appealOutcome: null }, { appealOutcome: 'UPHELD' }],
        revokedAt: null,
      },
      select: { level: true },
    });
    const suggested = nextSanctionLevel(history.map((h) => h.level));
    const ladder = (l: SanctionLevel) =>
      ['WARNING', 'REVIEW_RESTRICTION', 'SUSPENSION', 'PERMANENT_BAN'].indexOf(l);
    if (ladder(body.level) > ladder(suggested) && !body.skipLevel) {
      throw invalid(
        '/level',
        'level_skipped',
        `Önerilen basamak: ${suggested}; atlama gerekçeli işaretlenmeli`,
      );
    }
    const now = new Date();
    const endsAt = TIMED_LEVELS.has(body.level)
      ? new Date(now.getTime() + body.durationDays! * DAY)
      : null;
    const s = await this.prisma.$transaction(async (tx) => {
      const created = await tx.accountSanction.create({
        data: {
          userId: user.id,
          level: body.level,
          reasonCode: body.reasonCode,
          note: body.note,
          skippedLevel: ladder(body.level) > ladder(suggested),
          startsAt: now,
          endsAt,
          issuedById: ctx.userId,
        },
        include: { user: true },
      });
      if (BLOCKING.includes(body.level)) {
        await tx.user.update({ where: { id: user.id }, data: { status: 'SUSPENDED' } });
        await tx.session.updateMany({
          where: { userId: user.id, revokedAt: null },
          data: { revokedAt: now },
        });
      }
      await this.record(tx, ctx, 'moderation.sanction.issued', created.id, meta, {
        level: body.level,
        reasonCode: body.reasonCode,
        suggested,
        skipped: created.skippedLevel,
      });
      return created;
    });
    const token = signToken(
      { s: s.id },
      this.env.CURSOR_SECRET,
      APPEAL_PURPOSE,
      APPEAL_WINDOW,
    ).token;
    await this.email.send({
      to: user.email,
      ...sanctionEmails.issued(
        T.levels[body.level],
        T.reasons[body.reasonCode],
        body.note,
        endsAt ? formatLongDate(endsAt) : null,
        `${this.env.WEB_BASE_URL}/itiraz/yaptirim?belirtec=${encodeURIComponent(token)}`,
      ),
      category: 'transactional',
    });
    return { sanction: this.dto(s), suggestedLevel: suggested };
  }

  /** E-postadaki imzalı bağlantıyla itiraz (askıdaki hesap giriş yapamaz); bir kez, 14 gün içinde. */
  async appeal(token: string, statement: string) {
    const t = verifyToken<{ s: string }>(token, this.env.CURSOR_SECRET, APPEAL_PURPOSE);
    if (!t) {
      throw new ProblemException(
        HttpStatus.BAD_REQUEST,
        'INVALID_TOKEN',
        'Bağlantı geçersiz ya da süresi dolmuş',
      );
    }
    const moved = await this.prisma.accountSanction.updateMany({
      where: { id: t.s, appealedAt: null, revokedAt: null },
      data: { appealStatement: statement, appealedAt: new Date(), version: { increment: 1 } },
    });
    if (!moved.count)
      throw problem(HttpStatus.CONFLICT, 'CONFLICT', 'Bu karara zaten itiraz edildi');
    return { accepted: true as const };
  }

  async decideAppeal(
    ctx: AuthContext,
    id: string,
    body: { version: number; outcome: 'UPHELD' | 'OVERTURNED'; note: string },
    meta: RequestMeta,
  ) {
    const s = await this.prisma.accountSanction.findUnique({ where: { id } });
    if (!s || !s.appealedAt || s.appealOutcome) throw notFound();
    if (s.issuedById === ctx.userId) {
      throw problem(
        HttpStatus.FORBIDDEN,
        'FORBIDDEN',
        'İtirazı yaptırımı uygulayan moderatör inceleyemez',
      );
    }
    if (s.version !== body.version) throw stale();
    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.accountSanction.update({
        where: { id },
        data: {
          appealOutcome: body.outcome,
          appealDecidedById: ctx.userId,
          appealDecidedAt: now,
          appealNote: body.note,
          ...(body.outcome === 'OVERTURNED'
            ? { revokedAt: now, revokedById: ctx.userId, revokeReason: 'APPEAL_OVERTURNED' }
            : {}),
          version: { increment: 1 },
        },
        include: { user: true },
      });
      if (body.outcome === 'OVERTURNED') await this.restoreIfClear(tx, s.userId);
      await this.record(tx, ctx, 'moderation.sanction.appeal_decided', id, meta, {
        outcome: body.outcome,
      });
      return u;
    });
    await this.email.send({
      to: updated.user.email,
      ...sanctionEmails.appealDecided(body.outcome === 'OVERTURNED', body.note),
      category: 'transactional',
    });
    return this.dto(updated);
  }

  async revoke(
    ctx: AuthContext,
    id: string,
    body: { version: number; note: string },
    meta: RequestMeta,
  ) {
    const s = await this.prisma.accountSanction.findUnique({ where: { id } });
    if (!s || s.revokedAt) throw notFound();
    if (s.version !== body.version) throw stale();
    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.accountSanction.update({
        where: { id },
        data: {
          revokedAt: new Date(),
          revokedById: ctx.userId,
          revokeReason: body.note,
          version: { increment: 1 },
        },
        include: { user: true },
      });
      await this.restoreIfClear(tx, s.userId);
      await this.record(tx, ctx, 'moderation.sanction.revoked', id, meta, { level: s.level });
      return u;
    });
    await this.email.send({
      to: updated.user.email,
      ...sanctionEmails.revoked(),
      category: 'transactional',
    });
    return this.dto(updated);
  }

  /** Süresi dolan askıları kaldırır (işçi). Döndürülen: yeniden etkinleşen hesap sayısı. */
  async liftExpired(now = new Date()): Promise<number> {
    const suspended = await this.prisma.user.findMany({
      where: { status: 'SUSPENDED' },
      select: { id: true },
      take: 500,
    });
    let lifted = 0;
    for (const u of suspended) {
      lifted += await this.prisma.$transaction((tx) => this.restoreIfClear(tx, u.id, now));
    }
    return lifted;
  }

  /**
   * Toplu sahte değerlendirme temizliği: seçilen yayındaki değerlendirmeler gerekçeyle kaldırılır (yazar itiraz
   * edebilir), istatistik outbox ile yeniden hesaplanır, listelemeye tarihli bildirim yazılır.
   */
  async integrity(
    ctx: AuthContext,
    listingId: string,
    body: { reviewIds: string[]; note: string },
    meta: RequestMeta,
  ) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw notFound();
    const rows = await this.prisma.review.findMany({
      where: { id: { in: body.reviewIds }, listingId, status: { in: ['PUBLISHED', 'PENDING'] } },
    });
    if (rows.length !== new Set(body.reviewIds).size) {
      throw invalid(
        '/reviewIds',
        'not_in_listing',
        'Değerlendirmelerin hepsi bu listelemede ve yayında/incelemede olmalı',
      );
    }
    if (rows.some((r) => r.userId === ctx.userId)) {
      throw problem(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'Kendi değerlendirmeni modere edemezsin');
    }
    const now = new Date();
    const notice = await this.prisma.$transaction(async (tx) => {
      for (const r of rows) {
        const updated = await tx.review.update({
          where: { id: r.id },
          data: {
            status: 'REMOVED',
            reasonCode: 'NOT_PERSONAL_EXPERIENCE',
            reasonNote: body.note,
            moderatedById: ctx.userId,
            moderatedAt: now,
            version: { increment: 1 },
          },
        });
        await this.reviews.changed(tx, updated, r.status);
      }
      const n = await tx.listingIntegrityNotice.create({
        data: { listingId, removedCount: rows.length, note: body.note, createdById: ctx.userId },
      });
      await this.audit.record(
        {
          actorId: ctx.userId,
          actorRole: ctx.roles.join(','),
          action: 'moderation.integrity.applied',
          targetType: 'listing',
          targetId: listingId,
          summary: { removed: rows.length, noticeId: n.id },
          ipPrefix: meta.ipPrefix,
          traceId: meta.traceId,
        },
        tx,
      );
      return n;
    });
    return { removed: rows.length, noticeId: notice.id };
  }

  /** Etkin askı/kalıcı kapatma kalmadıysa hesabı yeniden etkinleştirir. */
  private async restoreIfClear(tx: Tx, userId: string, now = new Date()): Promise<number> {
    const blocking = await tx.accountSanction.count({
      where: {
        userId,
        revokedAt: null,
        level: { in: BLOCKING },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
    });
    if (blocking) return 0;
    const res = await tx.user.updateMany({
      where: { id: userId, status: 'SUSPENDED' },
      data: { status: 'ACTIVE' },
    });
    return res.count;
  }

  private record(
    tx: Tx,
    ctx: AuthContext,
    action: string,
    targetId: string,
    meta: RequestMeta,
    summary: Prisma.InputJsonObject,
  ) {
    return this.audit.record(
      {
        actorId: ctx.userId,
        actorRole: ctx.roles.join(','),
        action,
        targetType: 'account_sanction',
        targetId,
        summary,
        ipPrefix: meta.ipPrefix,
        traceId: meta.traceId,
      },
      tx,
    );
  }

  private dto(s: AccountSanction & { user: User }): AdminSanction {
    return {
      id: s.id,
      user: { id: s.user.id, displayName: s.user.displayName, email: s.user.email },
      level: s.level,
      reasonCode: s.reasonCode as SanctionReason,
      note: s.note,
      skippedLevel: s.skippedLevel,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt?.toISOString() ?? null,
      active: isActive(s),
      issuedById: s.issuedById,
      revokedAt: s.revokedAt?.toISOString() ?? null,
      appeal: s.appealedAt
        ? {
            statement: s.appealStatement ?? '',
            appealedAt: s.appealedAt.toISOString(),
            outcome: (s.appealOutcome as 'UPHELD' | 'OVERTURNED' | null) ?? null,
            note: s.appealNote,
          }
        : null,
      version: s.version,
    };
  }
}
