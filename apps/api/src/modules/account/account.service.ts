import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import type { z } from 'zod';
import type {
  AccountDeletionBody,
  AccountExport,
  ListingKind,
  SearchHit,
} from '@incelemeler/contracts';
import { formatLongDate } from '@incelemeler/utils';
import { ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { randomToken, sha256 } from '../identity/crypto.js';
import type { AuthContext } from '../identity/auth.context.js';
import { verifyPassword } from '../identity/password.js';
import { EMAIL_PORT, type EmailPort } from '../notifications/email.port.js';
import { accountEmails } from '../notifications/email-templates.js';
import { AuditService } from '../platform/audit.service.js';
import { RateLimitService } from '../platform/rate-limit.service.js';
import { RatingStatsService } from '../reviews/rating-stats.service.js';
import { SearchIndexerService } from '../search/search-indexer.service.js';

/** Geri alma penceresi (REQ-HSP-011; B sınıfı varsayılan, A-022). */
export const ACCOUNT_DELETION_DAYS = 30;
const DAY = 86_400_000;
const CONFIRM_TTL = 60 * 60_000;

const invalidToken = () =>
  new ProblemException(
    HttpStatus.BAD_REQUEST,
    'INVALID_TOKEN',
    'Bağlantı geçersiz ya da süresi dolmuş',
  );
const notFound = () =>
  new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Listeleme bulunamadı');

/**
 * Üye hesabı: kaydedilenler, veri dışa aktarma ve hesap silme (REQ-HSP-011/012, REQ-KVK-020/021).
 * Silme: talep → "silme bekliyor" (giriş kapalı, oturumlar kapanır) → 30 gün içinde e-postadaki bağlantıyla geri
 * alınabilir → süre sonunda veriler silinir, hesap kaydı anonimleştirilir; denetim kayıtları kalır.
 */
@Injectable()
export class AccountService {
  private readonly logger = new Logger('Account');

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly rateLimit: RateLimitService,
    private readonly ratingStats: RatingStatsService,
    private readonly indexer: SearchIndexerService,
    @Inject(EMAIL_PORT) private readonly email: EmailPort,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  // ── Kaydedilenler ──

  async favorites(ctx: AuthContext) {
    const rows = await this.prisma.favorite.findMany({
      where: { userId: ctx.userId, listing: { deletedAt: null } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    const docs = await this.prisma.searchDocument.findMany({
      where: { docType: 'LISTING', refId: { in: rows.map((r) => r.listingId) } },
    });
    const byId = new Map(docs.map((d) => [d.refId, d]));
    return {
      data: rows.flatMap((r) => {
        const d = byId.get(r.listingId);
        if (!d) return [];
        const hit: SearchHit = {
          type: 'LISTING',
          id: d.refId,
          title: d.title,
          subtitle: d.subtitle,
          path: d.path,
          kind: d.kind as ListingKind | null,
          articleType: null,
          status: d.status,
          priceLevel: d.priceLevel,
          ratingCount: d.ratingCount,
          distanceKm: null,
          dataOrigin: d.dataOrigin,
          commercial: { type: 'NONE' },
        };
        return [{ listing: hit, createdAt: r.createdAt.toISOString() }];
      }),
    };
  }

  async favoriteState(ctx: AuthContext, listingId: string) {
    const f = await this.prisma.favorite.findUnique({
      where: { userId_listingId: { userId: ctx.userId, listingId } },
    });
    return { saved: !!f };
  }

  async addFavorite(ctx: AuthContext, listingId: string) {
    await this.rateLimit.enforce(`favorite:user:${ctx.userId}`, 120, 3600);
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, deletedAt: null, status: { not: 'DRAFT' } },
      select: { id: true },
    });
    if (!listing) throw notFound();
    await this.prisma.favorite.upsert({
      where: { userId_listingId: { userId: ctx.userId, listingId } },
      create: { userId: ctx.userId, listingId },
      update: {},
    });
    return { saved: true };
  }

  async removeFavorite(ctx: AuthContext, listingId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId: ctx.userId, listingId } });
    return { saved: false };
  }

  // ── Dışa aktarma ──

  /** Kullanıcının kendisiyle ilgili verileri (REQ-HSP-012); parola karması, token ve iç işaretler hariç. */
  async export(ctx: AuthContext): Promise<AccountExport> {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: ctx.userId } });
    const [reviews, drafts, favorites, reports, appeals, sessions] = await Promise.all([
      this.prisma.review.findMany({
        where: { userId: u.id },
        include: { listing: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.reviewDraft.findMany({ where: { userId: u.id } }),
      this.prisma.favorite.findMany({
        where: { userId: u.id },
        include: { listing: { select: { name: true } } },
      }),
      this.prisma.contentReport.findMany({ where: { reporterId: u.id } }),
      this.prisma.moderationAppeal.findMany({ where: { appellantId: u.id } }),
      this.prisma.session.findMany({ where: { userId: u.id } }),
    ]);
    const iso = (d: Date | null) => d?.toISOString() ?? null;
    return {
      exportedAt: new Date().toISOString(),
      format: 'incelemeler-account-export/1',
      profile: {
        email: u.email,
        displayName: u.displayName,
        emailVerifiedAt: iso(u.emailVerifiedAt),
        ageConfirmedAt: iso(u.ageConfirmedAt),
        termsVersion: u.termsVersion,
        createdAt: u.createdAt.toISOString(),
      },
      reviews: reviews.map((r) => ({
        id: r.id,
        listing: r.listing,
        rating: r.rating,
        title: r.title,
        body: r.body,
        status: r.status,
        experienceMonth: r.experienceMonth,
        incentivized: r.incentivized,
        createdAt: r.createdAt.toISOString(),
        publishedAt: iso(r.publishedAt),
      })),
      reviewDrafts: drafts.map((d) => ({
        listingId: d.listingId,
        updatedAt: d.updatedAt.toISOString(),
        data: d.data,
      })),
      favorites: favorites.map((f) => ({
        listingId: f.listingId,
        name: f.listing.name,
        createdAt: f.createdAt.toISOString(),
      })),
      reports: reports.map((r) => ({
        id: r.id,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      appeals: appeals.map((a) => ({
        id: a.id,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
      })),
      sessions: sessions.map((s) => ({
        createdAt: s.createdAt.toISOString(),
        lastSeenAt: iso(s.lastSeenAt),
        userAgent: s.userAgent,
      })),
    };
  }

  // ── Hesap silme ──

  /** Oturum içinden silme (Hesabım › Hesabımı sil): parola ile onay (REQ-KVK-020). */
  async requestDeletion(
    ctx: AuthContext,
    body: z.infer<typeof AccountDeletionBody>,
    meta: RequestMeta,
  ) {
    await this.rateLimit.enforce(`deletion:user:${ctx.userId}`, 5, 3600);
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: ctx.userId },
      include: { roles: true },
    });
    if (!(await verifyPassword(u.passwordHash, body.password))) {
      throw new ProblemException(HttpStatus.UNAUTHORIZED, 'INVALID_CREDENTIALS', 'Parola hatalı');
    }
    return this.startDeletion(u.id, u.roles.length > 0, 'self_service', meta);
  }

  /** Girişsiz talep (`/hesap-silme`): yanıt hesabın varlığını sızdırmaz; onay bağlantısı e-postayla. */
  async requestDeletionByEmail(email: string, meta: RequestMeta): Promise<{ accepted: true }> {
    await this.rateLimit.enforce(`deletion:ip:${meta.ipPrefix ?? meta.ip}`, 5, 3600);
    const limited = await this.rateLimit.hit(`deletion:acct:${sha256(email)}`, 3, 3600);
    if (!limited.allowed) return { accepted: true };
    const u = await this.prisma.user.findUnique({ where: { email }, include: { roles: true } });
    if (!u || u.status !== 'ACTIVE' || u.roles.length) return { accepted: true };
    const token = await this.issueToken(u.id, 'DELETE_ACCOUNT', CONFIRM_TTL);
    const t = accountEmails.confirmDeletion(
      `${this.env.WEB_BASE_URL}/hesap-silme/onay?belirtec=${encodeURIComponent(token)}`,
    );
    await this.email.send({ to: u.email, ...t, category: 'transactional' });
    return { accepted: true };
  }

  async confirmDeletion(token: string, meta: RequestMeta) {
    const row = await this.consumeToken(token, 'DELETE_ACCOUNT');
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: row.userId },
      include: { roles: true },
    });
    if (u.status !== 'ACTIVE') throw invalidToken();
    return this.startDeletion(u.id, u.roles.length > 0, 'email_link', meta);
  }

  async cancelDeletion(token: string, meta: RequestMeta): Promise<{ accepted: true }> {
    const row = await this.consumeToken(token, 'CANCEL_DELETION');
    const res = await this.prisma.user.updateMany({
      where: { id: row.userId, status: 'PENDING_DELETION' },
      data: { status: 'ACTIVE', deletionRequestedAt: null, version: { increment: 1 } },
    });
    if (res.count !== 1) throw invalidToken();
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: row.userId } });
    await this.audit.record({
      actorId: u.id,
      actorRole: 'member',
      action: 'account.deletion_cancelled',
      targetType: 'user',
      targetId: u.id,
      ipPrefix: meta.ipPrefix,
      traceId: meta.traceId,
    });
    await this.email.send({
      to: u.email,
      ...accountEmails.deletionCancelled(),
      category: 'transactional',
    });
    return { accepted: true };
  }

  private async startDeletion(userId: string, staff: boolean, via: string, meta: RequestMeta) {
    // Personel hesabı self-servis silinmez: yetkiler önce yönetici tarafından kaldırılır (denetim izi).
    if (staff) {
      throw new ProblemException(
        HttpStatus.CONFLICT,
        'CONFLICT',
        'Personel hesabı bu yolla silinemez',
      );
    }
    const now = new Date();
    const scheduledFor = new Date(now.getTime() + ACCOUNT_DELETION_DAYS * DAY);
    const cancel = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { status: 'PENDING_DELETION', deletionRequestedAt: now, version: { increment: 1 } },
      });
      await tx.session.deleteMany({ where: { userId } });
      await tx.emailToken.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: now },
      });
      await this.audit.record(
        {
          actorId: userId,
          actorRole: 'member',
          action: 'account.deletion_requested',
          targetType: 'user',
          targetId: userId,
          summary: { via, scheduledFor: scheduledFor.toISOString() },
          ipPrefix: meta.ipPrefix,
          traceId: meta.traceId,
        },
        tx,
      );
      const token = randomToken();
      await tx.emailToken.create({
        data: {
          userId,
          purpose: 'CANCEL_DELETION',
          tokenHash: sha256(token),
          expiresAt: scheduledFor,
        },
      });
      return token;
    });
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const t = accountEmails.deletionScheduled(
      formatLongDate(scheduledFor),
      `${this.env.WEB_BASE_URL}/hesap-silme/iptal?belirtec=${encodeURIComponent(cancel)}`,
    );
    await this.email.send({ to: u.email, ...t, category: 'transactional' });
    return { status: 'PENDING_DELETION' as const, scheduledFor: scheduledFor.toISOString() };
  }

  /**
   * Süresi dolan silmeleri uygular (worker; REQ-KVK-021): kaydedilenler, değerlendirmeler ve taslaklar,
   * oturumlar, tokenlar silinir; bildirimlerden bildiren kimliği ayrılır; hesap kaydı anonimleştirilir.
   * Denetim kayıtları yasal saklama için kalır (A-022).
   */
  async purgeDue(now = new Date()): Promise<number> {
    const due = await this.prisma.user.findMany({
      where: {
        status: 'PENDING_DELETION',
        deletionRequestedAt: { lte: new Date(now.getTime() - ACCOUNT_DELETION_DAYS * DAY) },
      },
      select: { id: true, email: true },
      take: 50,
    });
    for (const u of due) {
      const listings = await this.prisma.review.findMany({
        where: { userId: u.id },
        select: { listingId: true },
        distinct: ['listingId'],
      });
      await this.prisma.$transaction(async (tx) => {
        await tx.favorite.deleteMany({ where: { userId: u.id } });
        await tx.reviewDraft.deleteMany({ where: { userId: u.id } });
        await tx.moderationAppeal.deleteMany({ where: { appellantId: u.id } });
        await tx.review.deleteMany({ where: { userId: u.id } });
        await tx.contentReport.updateMany({
          where: { reporterId: u.id },
          data: { reporterId: null, reporterEmail: null },
        });
        await tx.consentRecord.updateMany({ where: { userId: u.id }, data: { userId: null } });
        await tx.session.deleteMany({ where: { userId: u.id } });
        await tx.emailToken.deleteMany({ where: { userId: u.id } });
        await tx.user.update({
          where: { id: u.id },
          data: {
            status: 'DELETED',
            email: `silinmis-${u.id}@silinmis.invalid`,
            displayName: 'Silinmiş üye',
            passwordHash: `!${randomToken(16)}`,
            emailVerifiedAt: null,
            version: { increment: 1 },
          },
        });
        await this.audit.record(
          {
            actorId: null,
            actorRole: 'system',
            action: 'account.deleted',
            targetType: 'user',
            targetId: u.id,
            summary: { listingsAffected: listings.length },
          },
          tx,
        );
      });
      for (const { listingId } of listings) {
        await this.ratingStats.recompute(listingId);
        await this.indexer.indexListing(listingId);
      }
      await this.email
        .send({ to: u.email, ...accountEmails.deleted(), category: 'transactional' })
        .catch((e: unknown) =>
          this.logger.warn(
            JSON.stringify({ event: 'account.deleted_mail_failed', message: String(e) }),
          ),
        );
    }
    return due.length;
  }

  private async issueToken(
    userId: string,
    purpose: 'DELETE_ACCOUNT' | 'CANCEL_DELETION',
    ttlMs: number,
  ) {
    const token = randomToken();
    await this.prisma.emailToken.create({
      data: { userId, purpose, tokenHash: sha256(token), expiresAt: new Date(Date.now() + ttlMs) },
    });
    return token;
  }

  private async consumeToken(token: string, purpose: 'DELETE_ACCOUNT' | 'CANCEL_DELETION') {
    const row = await this.prisma.emailToken.findUnique({ where: { tokenHash: sha256(token) } });
    if (!row || row.purpose !== purpose || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
      throw invalidToken();
    }
    const used = await this.prisma.emailToken.updateMany({
      where: { id: row.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (used.count !== 1) throw invalidToken();
    return row;
  }
}
