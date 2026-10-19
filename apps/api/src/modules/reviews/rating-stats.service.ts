import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { ListingKind, ModerationReason } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EMAIL_PORT, type EmailPort } from '../notifications/email.port.js';
import { reviewEmails } from '../notifications/email-templates.js';
import { OutboxService, type OutboxEvent } from '../outbox/outbox.service.js';
import { SearchIndexerService } from '../search/search-indexer.service.js';
import { choosePrior, computeStats } from './rating-stats.js';

const NO_LOCATION: ListingKind[] = ['PRODUCT', 'WORK'];

/**
 * `reviews.review.changed` işleyicisi: puan istatistiğini yeniden hesaplar (REQ-VER-007), arama belgesini
 * günceller ve yazara işlemsel e-posta gönderir (A6.4). Outbox sayesinde yeniden denenir.
 */
@Injectable()
export class RatingStatsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly indexer: SearchIndexerService,
    @Inject(EMAIL_PORT) private readonly email: EmailPort,
  ) {}

  onModuleInit(): void {
    this.outbox.register('reviews.review.changed', (e) => this.onChanged(e));
    this.outbox.register('reviews.report.decided', (e) => this.onReportDecided(e));
    this.outbox.register('reviews.appeal.decided', (e) => this.onAppealDecided(e));
  }

  private async onChanged(e: OutboxEvent): Promise<void> {
    const p = e.payload as { listingId: string; from: string | null; to: string };
    await this.recompute(p.listingId);
    await this.indexer.indexListing(p.listingId);
    if (p.from !== p.to) await this.notify(e.aggregateId, p.to);
  }

  /** Yalnızca yayımlanmış ve teşvik beyanı olmayan değerlendirmeler ortalamaya girer (A6.2, A6.4). */
  async recompute(listingId: string): Promise<void> {
    const listing = await this.prisma.listing.findUniqueOrThrow({
      where: { id: listingId },
      include: {
        location: true,
        primaryCategory: { include: { parent: { include: { parent: true } } } },
      },
    });
    const eligible = { status: 'PUBLISHED' as const, incentivized: false };
    const rows = await this.prisma.review.findMany({
      where: { listingId, ...eligible },
      select: { rating: true, criteriaRatings: true, publishedAt: true },
    });
    const criteria = await this.prisma.reviewCriterion.findMany({
      select: { id: true, name: true },
    });
    const agg = async (where: Prisma.ReviewWhereInput) => {
      const r = await this.prisma.review.aggregate({
        where: { ...eligible, ...where },
        _count: true,
        _sum: { rating: true },
      });
      return { count: r._count, sum: r._sum.rating ?? 0 };
    };
    // Grup: konumlu türlerde aynı il × birincil kategori; konumsuzlarda aynı birincil kategori (A6.2).
    const groupWhere: Prisma.ReviewWhereInput = {
      listing: {
        primaryCategoryId: listing.primaryCategoryId,
        ...(NO_LOCATION.includes(listing.kind as ListingKind) || !listing.location
          ? {}
          : { location: { provinceId: listing.location.provinceId } }),
      },
    };
    const parentId = listing.primaryCategory.parentId ?? listing.primaryCategoryId;
    const [group, parent, platform] = await Promise.all([
      agg(groupWhere),
      agg({
        listing: {
          OR: [
            { primaryCategoryId: parentId },
            { primaryCategory: { parentId } },
            { primaryCategory: { parent: { parentId } } },
          ],
        },
      }),
      agg({}),
    ]);
    const prior = choosePrior(group, parent, platform);
    const s = computeStats(
      rows.map((r) => ({
        rating: r.rating,
        criteria: r.criteriaRatings as Array<{ criterionId: string; rating: number }>,
        publishedAt: r.publishedAt!,
      })),
      prior,
      new Map(criteria.map((c) => [c.id, c.name])),
    );
    const data = {
      count: s.count,
      sum: s.sum,
      average: s.average,
      distribution: s.distribution,
      criteria: s.criteria,
      last12Count: s.last12Count,
      last12Avg: s.last12Avg,
      bayes: s.bayes,
      prior: s.prior,
    };
    await this.prisma.listingRatingStats.upsert({
      where: { listingId },
      create: { listingId, ...data },
      update: data,
    });
  }

  private async notify(reviewId: string, to: string): Promise<void> {
    const r = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { user: true, listing: true },
    });
    if (!r || r.status !== to) return; // Sonraki bir geçiş zaten işlendi.
    const reason = r.reasonCode
      ? (tr.reviews.reasons[r.reasonCode as ModerationReason] ?? r.reasonCode)
      : '';
    const t =
      to === 'PENDING'
        ? reviewEmails.pending(r.listing.name)
        : to === 'PUBLISHED' && r.moderationMode === 'PRE'
          ? reviewEmails.published(r.listing.name)
          : to === 'REJECTED'
            ? reviewEmails.rejected(r.listing.name, reason, r.reasonNote)
            : to === 'REMOVED' && r.reasonCode !== 'USER_REQUEST'
              ? reviewEmails.removed(r.listing.name, reason, r.reasonNote)
              : null;
    if (t) await this.email.send({ to: r.user.email, ...t, category: 'transactional' });
  }

  /** Bildirim sahibine sonuç; misafir e-postası gönderimden sonra silinir (veri minimizasyonu). */
  private async onReportDecided(e: OutboxEvent): Promise<void> {
    const report = await this.prisma.contentReport.findUnique({
      where: { id: e.aggregateId },
      include: { reporter: true },
    });
    if (!report || report.status === 'OPEN') return;
    const to = report.reporter?.email ?? report.reporterEmail;
    if (to) {
      await this.email.send({
        to,
        ...reviewEmails.reportDecided(report.status === 'UPHELD'),
        category: 'transactional',
      });
    }
    if (report.reporterEmail) {
      await this.prisma.contentReport.update({
        where: { id: report.id },
        data: { reporterEmail: null },
      });
    }
  }

  private async onAppealDecided(e: OutboxEvent): Promise<void> {
    const a = await this.prisma.moderationAppeal.findUnique({
      where: { id: e.aggregateId },
      include: { appellant: true },
    });
    if (!a || a.status === 'OPEN') return;
    await this.email.send({
      to: a.appellant.email,
      ...reviewEmails.appealDecided(a.status === 'OVERTURNED', a.note ?? ''),
      category: 'transactional',
    });
  }
}
