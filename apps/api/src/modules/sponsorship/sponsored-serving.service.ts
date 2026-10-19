import { randomUUID } from 'node:crypto';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import type { z } from 'zod';
import {
  type PlacementSurface,
  SURFACE_CAPS,
  type SearchHit,
  type SponsoredEventBody,
  type SponsoredItem,
} from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import { signToken, verifyToken } from '../../common/signed-token.js';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import type { CampaignStatus } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { classifyClick } from '../outbound/outbound-url.js';
import { type ClickHeaders, OutboundService } from '../outbound/outbound.service.js';
import { RateLimitService } from '../platform/rate-limit.service.js';
import { SEARCH_PORT, type SearchCriteria, type SearchPort } from '../search/search.port.js';
import { assignPositions, type Candidate, pickPlacements } from './rotation.js';

const IMP_PURPOSE = 'sponsored-imp';
const CLICK_PURPOSE = 'sponsored-click';
const IMP_TTL_MS = 30 * 60_000;
const CLICK_TTL_MS = 24 * 3_600_000;
const VIEW_DEDUPE_MS = 30 * 60_000;
const CLICK_DEDUPE_MS = 30_000;
/** Yayındaki kampanya: SCHEDULED ya da LIVE ve zaman penceresi içinde (REQ-SPN-005; A-021). */
const SERVING_STATUSES = ['SCHEDULED', 'LIVE'] as const;

interface ImpressionToken extends Record<string, unknown> {
  pl: string;
  s: PlacementSurface;
  d: boolean;
}
type Context = {
  surface: PlacementSurface;
  /** Organik sorgu ölçütleri: sponsorlu öğe aynı ölçütlerle eşleşmek zorunda (alaka — REQ-SPN-004). */
  criteria: SearchCriteria;
  organicCount: number;
  categoryId: string | null;
  provinceId: string | null;
  excludeListingId?: string;
  excludeOrganizationId?: string | null;
};

const notFound = () =>
  new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Yerleşim bulunamadı');

/**
 * Sponsorlu yerleşim sunumu (REQ-SPN-002/004/005/008/009/010/012). Organik sonuçlara dokunmaz: yalnızca
 * organik sorgunun ölçütleriyle eşleşen adaylar arasından ayrı bir dizi üretir (AK-04, REQ-ARA-009).
 * Hedefleme yalnızca bağlamsal (yüzey, kategori, il); kişisel sinyal kullanılmaz.
 */
@Injectable()
export class SponsoredServingService {
  private readonly logger = new Logger('Sponsored');

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbound: OutboundService,
    private readonly rateLimit: RateLimitService,
    @Inject(SEARCH_PORT) private readonly search: SearchPort,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  private get production() {
    return this.env.APP_ENV === 'production';
  }

  /** Arama ve kategori/keşif listeleri için yerleşimler. */
  async forList(ctx: Context, seed: string = randomUUID()): Promise<SponsoredItem[]> {
    if (ctx.organicCount === 0) return [];
    return this.serve(ctx, seed);
  }

  /**
   * Ana sayfa sponsorlu modülü (A8.3): bağlam yalnızca seçilen il (varsa); kart sayısı çağıran tarafından
   * sınırlanır (≤ 2 ve tüm kartların ≤ %20'si).
   */
  async forHome(provinceId: string | null, maxItems: number, seed: string = randomUUID()) {
    if (maxItems <= 0) return [];
    const items = await this.serve(
      {
        surface: 'HOME',
        criteria: this.criteria({ categoryId: null, provinceId }),
        organicCount: 100,
        categoryId: null,
        provinceId,
      },
      seed,
    );
    return items.slice(0, maxItems);
  }

  /** Listeleme detayındaki rakip kutu: aynı birincil kategori + il, kendisi ve aynı kuruluş hariç. */
  async forListing(id: string, seed: string = randomUUID()): Promise<{ data: SponsoredItem[] }> {
    const l = await this.prisma.listing.findFirst({
      where: { id, deletedAt: null, status: 'PUBLISHED' },
      include: { location: true },
    });
    if (!l) throw notFound();
    const provinceId = l.location?.provinceId ?? null;
    const data = await this.serve(
      {
        surface: 'LISTING_DETAIL',
        criteria: this.criteria({ categoryId: l.primaryCategoryId, provinceId }),
        organicCount: 1,
        categoryId: l.primaryCategoryId,
        provinceId,
        excludeListingId: l.id,
        excludeOrganizationId: l.organizationId,
      },
      seed,
    );
    return { data };
  }

  criteria(c: { categoryId: string | null; provinceId: string | null }): SearchCriteria {
    return {
      tokens: [],
      docTypes: ['LISTING'],
      kind: null,
      categoryId: c.categoryId,
      provinceId: c.provinceId,
      districtId: null,
      priceMax: null,
      minRating: null,
      attributes: {},
      excludeDemo: this.production,
      sort: 'recommended',
      near: null,
      offset: 0,
      limit: 20,
      fuzzy: false,
      matchAny: false,
    };
  }

  private async serve(ctx: Context, seed: string): Promise<SponsoredItem[]> {
    const slots = await this.prisma.placementSlot.findMany({
      where: { surface: ctx.surface, enabled: true },
      orderBy: { key: 'asc' },
    });
    const slot = slots[0];
    if (!slot) return [];
    const cap = SURFACE_CAPS[ctx.surface];
    const maxItems = Math.min(slot.maxItems, cap.maxItems);
    if (maxItems === 0) return [];
    // Sponsorluğa kapalı bağlamda (ör. sağlık kategorisi sayfası) hiç yerleşim yok (REQ-SPN-006).
    if (ctx.categoryId && !(await this.sponsorshipAllowed([ctx.categoryId]))) return [];

    const now = new Date();
    const rows = await this.prisma.campaignPlacement.findMany({
      where: {
        slotId: slot.id,
        campaign: {
          status: { in: [...SERVING_STATUSES] },
          startsAt: { lte: now },
          endsAt: { gt: now },
          ...(this.production ? { dataOrigin: { not: 'DEMO' } } : {}),
        },
        listing: {
          deletedAt: null,
          status: 'PUBLISHED',
          ...(this.production ? { dataOrigin: { not: 'DEMO' } } : {}),
          ...(slot.allowedKinds.length ? { kind: { in: slot.allowedKinds } } : {}),
          ...(ctx.excludeListingId ? { id: { not: ctx.excludeListingId } } : {}),
          ...(ctx.excludeOrganizationId
            ? {
                OR: [
                  { organizationId: null },
                  { organizationId: { not: ctx.excludeOrganizationId } },
                ],
              }
            : {}),
        },
      },
      include: {
        campaign: {
          select: {
            id: true,
            dataOrigin: true,
            sponsor: { select: { name: true } },
            creatives: { where: { approval: 'APPROVED' }, orderBy: { createdAt: 'asc' }, take: 1 },
          },
        },
        listing: { select: { id: true, primaryCategoryId: true, dataOrigin: true } },
      },
    });
    if (!rows.length) return [];

    // Bağlamsal hedefleme: hedef kategori/il verilmişse bağlam onunla eşleşmeli.
    const targeted: typeof rows = [];
    for (const r of rows) {
      if (r.targetAreaId && r.targetAreaId !== ctx.provinceId) continue;
      if (r.targetCategoryId) {
        if (!ctx.categoryId) continue;
        const chain = await this.ancestorIds(ctx.categoryId);
        if (!chain.includes(r.targetCategoryId)) continue;
      }
      if (!(await this.sponsorshipAllowed([r.listing.primaryCategoryId]))) continue;
      targeted.push(r);
    }
    if (!targeted.length) return [];

    // Alaka (A8.3): aday, organik sorgunun tüm ölçütleriyle (metin, yer, kategori, filtre) eşleşmeli.
    const ids = [...new Set(targeted.map((r) => r.listingId))];
    const { rows: matched } = await this.search.query({
      ...ctx.criteria,
      docTypes: ['LISTING'],
      refIds: ids,
      offset: 0,
      limit: ids.length,
      fuzzy: false,
    });
    const hits = new Map(matched.map((m) => [m.refId, m]));
    const candidates: Candidate[] = targeted
      .filter((r) => hits.has(r.listingId))
      .map((r) => ({
        placementId: r.id,
        campaignId: r.campaignId,
        listingId: r.listingId,
        priority: r.priority,
        weight: r.weight,
      }));
    const picked = assignPositions(
      pickPlacements(candidates, maxItems, seed),
      slot.positions,
      ctx.organicCount,
    );
    if (!picked.length) return [];

    const byId = new Map(targeted.map((r) => [r.id, r]));
    const items: SponsoredItem[] = picked.map(({ position, item: c }) => {
      const r = byId.get(c.placementId)!;
      const hit = hits.get(c.listingId)!;
      const demo = r.campaign.dataOrigin === 'DEMO' || r.listing.dataOrigin === 'DEMO';
      const sponsor = r.campaign.sponsor.name;
      const card: SearchHit = {
        type: 'LISTING',
        id: hit.refId,
        title: hit.title,
        subtitle: r.campaign.creatives[0]?.title ?? hit.subtitle,
        path: hit.path,
        kind: hit.kind,
        articleType: null,
        status: hit.status,
        priceLevel: hit.priceLevel,
        ratingCount: hit.ratingCount,
        distanceKm: hit.distanceKm,
        dataOrigin: hit.dataOrigin,
        commercial: {
          type: 'SPONSORED',
          sponsor,
          label: tr.sponsored.label,
          why: tr.sponsored.why.replace('{sponsor}', sponsor),
        },
      };
      const imp: ImpressionToken = { pl: r.id, s: ctx.surface, d: demo };
      return {
        position,
        placementId: r.id,
        item: card,
        clickHref: `/git/s/${r.id}?ctx=${encodeURIComponent(
          signToken({ s: ctx.surface }, this.env.CURSOR_SECRET, CLICK_PURPOSE, CLICK_TTL_MS).token,
        )}`,
        impressionToken: signToken(imp, this.env.CURSOR_SECRET, IMP_PURPOSE, IMP_TTL_MS).token,
      };
    });
    // "Sunulan" olayı (REQ-SPN-009): yanıtı bekletmez.
    void this.prisma.sponsoredEvent
      .createMany({
        data: items.map((i) => {
          const r = byId.get(i.placementId)!;
          const demo = r.campaign.dataOrigin === 'DEMO' || r.listing.dataOrigin === 'DEMO';
          return {
            placementId: i.placementId,
            type: 'SERVED',
            surface: ctx.surface,
            demo,
            counted: !demo,
          };
        }),
      })
      .catch((e: unknown) =>
        this.logger.warn(JSON.stringify({ event: 'sponsored.served_failed', message: String(e) })),
      );
    return items;
  }

  /**
   * Görüntülenen gösterim (REQ-SPN-009/010): imzalı belirteç; bot, otomasyon ve önceden getirme sayılmaz;
   * aynı oturum + yerleşim için 30 dk tekilleştirme; demo olaylar işaretli ve raporsuz.
   */
  async event(
    body: z.infer<typeof SponsoredEventBody>,
    headers: ClickHeaders,
    meta: RequestMeta,
  ): Promise<{ accepted: boolean }> {
    await this.rateLimit.enforce(`sponsored-event:${meta.ipPrefix ?? meta.ip}`, 300, 3600);
    const t = verifyToken<ImpressionToken>(body.token, this.env.CURSOR_SECRET, IMP_PURPOSE);
    if (!t) return { accepted: false };
    const placement = await this.prisma.campaignPlacement.findUnique({ where: { id: t.pl } });
    if (!placement) return { accepted: false };
    const { bot, prefetch } = classifyClick(headers);
    const sessionHash = this.outbound.sessionHash(headers.ip, headers.userAgent);
    const flaggedBot = bot || body.automated;
    const recent =
      flaggedBot || prefetch || t.d
        ? null
        : await this.prisma.sponsoredEvent.findFirst({
            where: {
              placementId: t.pl,
              type: 'VIEWED',
              sessionHash,
              counted: true,
              createdAt: { gte: new Date(Date.now() - VIEW_DEDUPE_MS) },
            },
            select: { id: true },
          });
    const counted = !flaggedBot && !prefetch && !t.d && !recent;
    await this.prisma.sponsoredEvent.create({
      data: {
        placementId: t.pl,
        type: 'VIEWED',
        surface: t.s,
        sessionHash,
        bot: flaggedBot,
        prefetch,
        demo: t.d,
        counted,
      },
    });
    return { accepted: counted };
  }

  /** Sponsorlu kart tıklaması: hedef yalnızca kayıttan (listeleme yolu); açık yönlendirme yok. */
  async click(
    id: string,
    ctxToken: string | undefined,
    headers: ClickHeaders,
  ): Promise<{ path: string }> {
    const p = await this.prisma.campaignPlacement.findUnique({
      where: { id },
      include: {
        campaign: { select: { status: true, startsAt: true, endsAt: true, dataOrigin: true } },
        listing: { select: { id: true, status: true, deletedAt: true, dataOrigin: true } },
      },
    });
    if (!p || p.listing.deletedAt || p.listing.status !== 'PUBLISHED') throw notFound();
    const doc = await this.prisma.searchDocument.findFirst({
      where: { docType: 'LISTING', refId: p.listingId },
      select: { path: true },
    });
    if (!doc) throw notFound();
    const now = new Date();
    const live =
      (SERVING_STATUSES as readonly string[]).includes(p.campaign.status) &&
      p.campaign.startsAt <= now &&
      p.campaign.endsAt > now;
    const ctx = ctxToken
      ? verifyToken<{ s: PlacementSurface }>(ctxToken, this.env.CURSOR_SECRET, CLICK_PURPOSE)
      : null;
    void this.recordClick(
      p.id,
      ctx?.s ?? null,
      live,
      p.campaign.dataOrigin === 'DEMO' || p.listing.dataOrigin === 'DEMO',
      headers,
    ).catch((e: unknown) =>
      this.logger.warn(JSON.stringify({ event: 'sponsored.click_failed', message: String(e) })),
    );
    return { path: doc.path };
  }

  private async recordClick(
    placementId: string,
    surface: PlacementSurface | null,
    live: boolean,
    demo: boolean,
    h: ClickHeaders,
  ) {
    const { bot, prefetch } = classifyClick(h);
    const sessionHash = this.outbound.sessionHash(h.ip, h.userAgent);
    const recent =
      bot || prefetch || demo || !live
        ? null
        : await this.prisma.sponsoredEvent.findFirst({
            where: {
              placementId,
              type: 'CLICK',
              sessionHash,
              counted: true,
              createdAt: { gte: new Date(Date.now() - CLICK_DEDUPE_MS) },
            },
            select: { id: true },
          });
    const slot = surface ?? (await this.slotSurface(placementId));
    await this.prisma.sponsoredEvent.create({
      data: {
        placementId,
        type: 'CLICK',
        surface: slot,
        sessionHash,
        bot,
        prefetch,
        demo,
        counted: live && !bot && !prefetch && !demo && !recent,
      },
    });
  }

  private async slotSurface(placementId: string): Promise<PlacementSurface> {
    const p = await this.prisma.campaignPlacement.findUniqueOrThrow({
      where: { id: placementId },
      select: { slot: { select: { surface: true } } },
    });
    return p.slot.surface;
  }

  private async ancestorIds(categoryId: string): Promise<string[]> {
    const out: string[] = [];
    let id: string | null = categoryId;
    while (id && out.length < 10) {
      out.push(id);
      const c: { parentId: string | null } | null = await this.prisma.category.findUnique({
        where: { id },
        select: { parentId: true },
      });
      id = c?.parentId ?? null;
    }
    return out;
  }

  /** Kategori ve tüm üstleri sponsorluğa açık mı (REQ-SPN-006). */
  async sponsorshipAllowed(categoryIds: string[]): Promise<boolean> {
    for (const id of categoryIds) {
      const chain = await this.ancestorIds(id);
      const blocked = await this.prisma.category.count({
        where: { id: { in: chain }, sponsorshipAllowed: false },
      });
      if (blocked) return false;
    }
    return true;
  }

  /** Listeleme bir sponsorun mu (REQ-GUN-004 ikinci onay): kuruluşu kampanya sponsoru ya da yerleşimde. */
  async isSponsorLinked(listingId: string): Promise<boolean> {
    const active = { status: { notIn: ['DRAFT', 'CANCELLED'] as CampaignStatus[] } };
    const l = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { organizationId: true },
    });
    const [byPlacement, byOrg] = await Promise.all([
      this.prisma.campaignPlacement.count({ where: { listingId, campaign: active } }),
      l?.organizationId
        ? this.prisma.campaign.count({ where: { sponsorId: l.organizationId, ...active } })
        : Promise.resolve(0),
    ]);
    return byPlacement + byOrg > 0;
  }
}
