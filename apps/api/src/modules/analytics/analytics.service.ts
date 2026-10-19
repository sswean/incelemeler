import { Inject, Injectable } from '@nestjs/common';
import type { z } from 'zod';
import type { AnalyticsIngestBody, AnalyticsOverview, RevenueReport } from '@incelemeler/contracts';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { classifyClick } from '../outbound/outbound-url.js';
import type { ClickHeaders } from '../outbound/outbound.service.js';
import { RateLimitService } from '../platform/rate-limit.service.js';
import type { RequestMeta } from '../../common/request-meta.js';

const DAY = 86_400_000;
/** Sorgu panosunda k-anonimlik eşiği: daha az aranan sorgular (kişisel veri riski) gösterilmez. */
const MIN_QUERY_COUNT = 3;
const STALE_SQL = Prisma.sql`
  l.status = 'PUBLISHED' AND l.deleted_at IS NULL AND (
    l.source_verified_at IS NULL OR l.source_verified_at < now() - (CASE l.kind
      WHEN 'PLACE' THEN 90 WHEN 'PRODUCT' THEN 7 WHEN 'EVENT' THEN 7 ELSE 180 END) * interval '1 day')`;

const n = (v: bigint | number | null | undefined) =>
  v === null || v === undefined ? 0 : Number(v);
const orNull = (v: number) => (v > 0 ? v : null);
const rate = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 10_000) / 10_000 : null);

/**
 * Analitik (REQ-ANL-001…006, REQ-ADM-002/010): olaylar yalnızca rızayla ve kişisel veri olmadan; panolar
 * yalnızca gerçek kayıtlardan; veri yoksa null ("Veri yok"). Bot, personel ve demo trafik raporlara girmez.
 */
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimit: RateLimitService,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  private get production() {
    return this.env.APP_ENV === 'production';
  }

  async ingest(
    body: z.infer<typeof AnalyticsIngestBody>,
    headers: ClickHeaders,
    staff: boolean,
    meta: RequestMeta,
  ) {
    await this.rateLimit.enforce(`analytics:ip:${meta.ipPrefix ?? meta.ip}`, 600, 3600);
    const { bot, prefetch } = classifyClick(headers);
    const e = body.event;
    await this.prisma.analyticsEvent.create({
      data: {
        name: e.name,
        anonymousId: body.anonymousId,
        sessionId: e.sessionId,
        path: e.path,
        props: e.props as Prisma.InputJsonObject,
        bot: bot || prefetch || e.automated,
        staff,
        demo: e.demo,
      },
    });
    return { accepted: true as const };
  }

  async overview(days: number, now = new Date()): Promise<AnalyticsOverview> {
    const since = new Date(now.getTime() - days * DAY);
    const real = Prisma.sql`created_at >= ${since} AND NOT bot AND NOT staff AND NOT demo`;
    const one = async (q: Prisma.Sql) =>
      n((await this.prisma.$queryRaw<Array<{ n: bigint }>>(q))[0]?.n);

    const activeVisitors = await one(
      Prisma.sql`SELECT count(DISTINCT anonymous_id) AS n FROM analytics_events WHERE ${real}`,
    );
    // Kuzey yıldızı (§6.3): ≥ 30 sn okuma, kaydetme ya da dış yönlendirmeyle biten oturum.
    const qualified = await one(
      Prisma.sql`SELECT count(DISTINCT session_id) AS n FROM analytics_events
        WHERE ${real} AND name IN ('engaged_30s', 'favorite_added', 'outbound_click')`,
    );
    const landings = await this.prisma.$queryRaw<Array<{ source: string; n: bigint }>>(
      Prisma.sql`SELECT props->>'source' AS source, count(*) AS n FROM analytics_events
        WHERE ${real} AND name = 'landing' GROUP BY 1 ORDER BY 2 DESC`,
    );

    const searchWhere = Prisma.sql`created_at >= ${since}`;
    const searches = await one(
      Prisma.sql`SELECT count(*) AS n FROM search_events WHERE ${searchWhere}`,
    );
    const zero = await one(
      Prisma.sql`SELECT count(*) AS n FROM search_events WHERE ${searchWhere} AND result_count = 0`,
    );
    const top = (zeroOnly: boolean) =>
      this.prisma.$queryRaw<Array<{ query: string; n: bigint }>>(
        Prisma.sql`SELECT query_norm AS query, count(*) AS n FROM search_events
          WHERE ${searchWhere} AND query_norm <> '' ${zeroOnly ? Prisma.sql`AND result_count = 0` : Prisma.empty}
          GROUP BY 1 HAVING count(*) >= ${MIN_QUERY_COUNT} ORDER BY 2 DESC, 1 LIMIT 20`,
      );
    const [topAll, topZero] = await Promise.all([top(false), top(true)]);

    const outbound = await this.prisma.$queryRaw<Array<{ kind: string; n: bigint }>>(
      Prisma.sql`SELECT l.kind::text AS kind, count(*) AS n FROM outbound_clicks c
        JOIN outbound_links l ON l.id = c.link_id
        WHERE c.created_at >= ${since} AND c.counted GROUP BY 1 ORDER BY 2 DESC`,
    );
    const sponsored = await this.prisma.$queryRaw<Array<{ type: string; n: bigint }>>(
      Prisma.sql`SELECT type::text AS type, count(*) AS n FROM sponsored_events
        WHERE created_at >= ${since} AND counted GROUP BY 1`,
    );
    const sp = (t: string) => n(sponsored.find((s) => s.type === t)?.n);

    const demo = this.production ? Prisma.sql`AND l.data_origin <> 'DEMO'` : Prisma.empty;
    const byCategory = await this.prisma.$queryRaw<Array<{ category: string; n: bigint }>>(
      Prisma.sql`SELECT COALESCE(root.name, c.name) AS category, count(*) AS n
        FROM listings l JOIN categories c ON c.id = l.primary_category_id
        LEFT JOIN LATERAL (
          WITH RECURSIVE up AS (
            SELECT id, parent_id, name FROM categories WHERE id = c.id
            UNION ALL SELECT p.id, p.parent_id, p.name FROM categories p JOIN up ON p.id = up.parent_id
          ) SELECT name FROM up WHERE parent_id IS NULL LIMIT 1
        ) root ON true
        WHERE l.status = 'PUBLISHED' AND l.deleted_at IS NULL ${demo}
        GROUP BY 1 ORDER BY 2 DESC`,
    );
    const stale = await one(
      Prisma.sql`SELECT count(*) AS n FROM listings l WHERE ${STALE_SQL} ${demo}`,
    );
    const articles = await this.prisma.article.count({
      where: { status: 'PUBLISHED', ...(this.production ? { dataOrigin: { not: 'DEMO' } } : {}) },
    });

    const [submitted, published, removed] = await Promise.all([
      this.prisma.review.count({ where: { submittedAt: { gte: since } } }),
      this.prisma.review.count({ where: { publishedAt: { gte: since } } }),
      this.prisma.review.count({ where: { status: 'REMOVED', moderatedAt: { gte: since } } }),
    ]);
    const reasons = await this.prisma.review.groupBy({
      by: ['reasonCode'],
      where: { status: 'REMOVED', moderatedAt: { gte: since } },
      _count: { _all: true },
    });
    const pending = await this.prisma.review.findMany({
      where: { status: 'PENDING' },
      select: { submittedAt: true },
    });
    const waits = pending
      .map((r) => (now.getTime() - r.submittedAt.getTime()) / 3_600_000)
      .sort((a, b) => a - b);
    const median = waits.length
      ? Math.round(
          (waits.length % 2
            ? waits[(waits.length - 1) / 2]!
            : (waits[waits.length / 2 - 1]! + waits[waits.length / 2]!) / 2) * 10,
        ) / 10
      : null;
    const favorites = await this.prisma.favorite.count({ where: { createdAt: { gte: since } } });
    const totalPublishedEver = await this.prisma.review.count({
      where: { publishedAt: { not: null } },
    });

    return {
      generatedAt: now.toISOString(),
      days,
      activeVisitors: orNull(activeVisitors),
      qualifiedSessions: orNull(qualified),
      landings: landings.map((l) => ({ source: l.source, count: n(l.n) })),
      searches: {
        total: orNull(searches),
        zeroResult: searches ? zero : null,
        zeroRate: rate(zero, searches),
        top: topAll.map((r) => ({ query: r.query, count: n(r.n) })),
        topZero: topZero.map((r) => ({ query: r.query, count: n(r.n) })),
      },
      outbound: {
        total: orNull(outbound.reduce((s, r) => s + n(r.n), 0)),
        byKind: outbound.map((r) => ({ kind: r.kind, count: n(r.n) })),
      },
      sponsored: {
        served: orNull(sp('SERVED')),
        viewed: orNull(sp('VIEWED')),
        clicks: orNull(sp('CLICK')),
      },
      content: {
        publishedListings: byCategory.map((r) => ({ category: r.category, count: n(r.n) })),
        publishedArticles: orNull(articles),
        staleListings: stale,
      },
      reviews: {
        submitted: orNull(submitted),
        published: orNull(published),
        removed: orNull(removed),
        removalReasons: reasons.map((r) => ({
          reason: r.reasonCode ?? 'UNKNOWN',
          count: r._count._all,
        })),
      },
      moderation: { pending: pending.length, medianWaitHours: median },
      favoritesAdded: orNull(favorites),
      applications: null,
      guardrails: {
        sponsoredPerSearch: rate(sp('SERVED'), searches),
        reviewRemovalRate: rate(removed, totalPublishedEver),
      },
    };
  }

  async dashboard(now = new Date()) {
    const since = new Date(now.getTime() - 7 * DAY);
    const demo = this.production ? Prisma.sql`AND l.data_origin <> 'DEMO'` : Prisma.empty;
    const [
      pending,
      reports,
      stale,
      openDsr,
      overdueDsr,
      campaigns,
      searches,
      clicks,
      reviews,
      favorites,
    ] = await Promise.all([
      this.prisma.review.count({ where: { status: 'PENDING' } }),
      this.prisma.contentReport.count({ where: { status: 'OPEN' } }),
      this.prisma
        .$queryRaw<Array<{ n: bigint }>>(
          Prisma.sql`SELECT count(*) AS n FROM listings l WHERE ${STALE_SQL} ${demo}`,
        )
        .then((r) => n(r[0]?.n)),
      this.prisma.dataSubjectRequest.count({
        where: { status: { in: ['RECEIVED', 'IN_PROGRESS'] } },
      }),
      this.prisma.dataSubjectRequest.count({
        where: { status: { in: ['RECEIVED', 'IN_PROGRESS'] }, dueAt: { lt: now } },
      }),
      this.prisma.campaign.count({
        where: {
          status: { in: ['SCHEDULED', 'LIVE'] },
          startsAt: { lte: now },
          endsAt: { gt: now },
        },
      }),
      this.prisma.searchEvent.count({ where: { createdAt: { gte: since } } }),
      this.prisma.outboundClick.count({ where: { createdAt: { gte: since }, counted: true } }),
      this.prisma.review.count({ where: { submittedAt: { gte: since } } }),
      this.prisma.favorite.count({ where: { createdAt: { gte: since } } }),
    ]);
    return {
      generatedAt: now.toISOString(),
      pendingModeration: pending,
      openReports: reports,
      staleListings: stale,
      openDataRequests: openDsr,
      overdueDataRequests: overdueDsr,
      activeCampaigns: campaigns,
      applications: null,
      last7Days: {
        searches,
        outboundClicks: clicks,
        reviewsSubmitted: reviews,
        favoritesAdded: favorites,
      },
    };
  }

  /** Gelir raporu (REQ-ADM-010): dönemle kesişen kampanyaların elle girilen anlaşma tutarları. */
  async revenue(from: string, to: string): Promise<RevenueReport> {
    const start = new Date(`${from}T00:00:00+03:00`);
    const end = new Date(new Date(`${to}T00:00:00+03:00`).getTime() + DAY);
    const rows = await this.prisma.campaign.findMany({
      where: {
        startsAt: { lt: end },
        endsAt: { gt: start },
        status: { notIn: ['DRAFT', 'CANCELLED'] },
        ...(this.production ? { dataOrigin: { not: 'DEMO' } } : {}),
      },
      include: { sponsor: { select: { name: true } } },
      orderBy: { startsAt: 'asc' },
    });
    const amounts = rows.map((c) => (c.budgetKurus === null ? null : Number(c.budgetKurus)));
    const known = amounts.filter((a): a is number => a !== null);
    return {
      generatedAt: new Date().toISOString(),
      from,
      to,
      sponsorship: rows.map((c, i) => ({
        campaignId: c.id,
        campaign: c.name,
        sponsor: c.sponsor.name,
        status: c.status,
        startsAt: c.startsAt.toISOString(),
        endsAt: c.endsAt.toISOString(),
        amountKurus: amounts[i]!,
        source: 'MANUAL_CONTRACT' as const,
      })),
      sponsorshipTotalKurus: known.length ? known.reduce((a, b) => a + b, 0) : null,
      affiliateEstimatedKurus: null,
      affiliateConfirmedKurus: null,
    };
  }
}
