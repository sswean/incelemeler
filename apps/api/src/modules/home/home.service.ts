import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { z } from 'zod';
import {
  type AdminHomeModule,
  type ArticleType,
  HOME_SPONSORED,
  type HomeCard,
  HomeModuleConfig,
  type HomeModuleUpdateBody,
  type HomeResponse,
  homeRuleErrors,
} from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { articlePath, STATIC_PATHS } from '@incelemeler/routes';
import { ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import type { HomeModule } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthContext } from '../identity/auth.context.js';
import { AuditService } from '../platform/audit.service.js';
import { SEARCH_PORT, type SearchPort } from '../search/search.port.js';
import { SponsoredServingService } from '../sponsorship/sponsored-serving.service.js';

const NONE = { type: 'NONE' } as const;
/** Organik içerik modüllerine giren türler (sponsorlu içerik kendi etiketiyle ayrı yüzeylerde). */
const GUIDE_TYPES: ArticleType[] = ['GUIDE', 'LIST', 'NEWS', 'REVIEW'];

const invalid = (codes: string[]) =>
  new ProblemException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'VALIDATION_FAILED',
    'Ana sayfa kuralları sağlanmadı',
    undefined,
    codes.map((code) => ({
      pointer: '/position',
      code,
      message: 'Sponsorlu sınırı aşılamaz (A8.3)',
    })),
  );

/**
 * Ana sayfa modül sistemi (Ek A15.4, REQ-ADM-006): her modül bir kayıt; öğe sayısı `minItems` altındaysa
 * modül gizlenir. Kişiselleştirme yalnızca açıkça seçilen il ile (rıza altyapısı D10; davranışsal yok).
 * Sponsorlu modül ilk 3 modülde değil, ≤ 2 kart ve tüm kartların ≤ %20'si (A8.3).
 */
@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly sponsored: SponsoredServingService,
    @Inject(SEARCH_PORT) private readonly search: SearchPort,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  private get production() {
    return this.env.APP_ENV === 'production';
  }

  async get(provinceSlug: string | undefined, now = new Date()): Promise<HomeResponse> {
    const province = provinceSlug
      ? await this.prisma.adminArea.findFirst({ where: { level: 'PROVINCE', slug: provinceSlug } })
      : null;
    const modules = await this.prisma.homeModule.findMany({
      where: {
        enabled: true,
        OR: [{ visibleFrom: null }, { visibleFrom: { lte: now } }],
        AND: [{ OR: [{ visibleUntil: null }, { visibleUntil: { gt: now } }] }],
      },
      orderBy: { position: 'asc' },
    });
    const visible = modules.filter((m) => !m.provinceSlug || m.provinceSlug === province?.slug);
    const built: Array<{ m: HomeModule; cards: HomeCard[] }> = [];
    for (const m of visible) {
      if (m.type === 'SPONSORED') {
        built.push({ m, cards: [] }); // organik kartlar sayıldıktan sonra doldurulur
        continue;
      }
      const cards = (await this.cards(m, province?.id ?? null)).slice(0, m.maxItems);
      if (cards.length >= m.minItems) built.push({ m, cards });
    }
    // Sponsorlu: s ≤ %20 × (organik + s) ⇒ s ≤ organik / 4.
    const organic = built.reduce((n, b) => n + b.cards.length, 0);
    let budget = Math.floor((organic * HOME_SPONSORED.cardShare) / (1 - HOME_SPONSORED.cardShare));
    for (const b of built.filter((x) => x.m.type === 'SPONSORED')) {
      const max = Math.min(b.m.maxItems, HOME_SPONSORED.maxCards, budget);
      const items = await this.sponsored.forHome(province?.id ?? null, max);
      budget -= items.length;
      b.cards = items.map((s) => ({
        kind: 'LISTING' as const,
        id: s.item.id,
        title: s.item.title,
        subtitle: s.item.subtitle,
        path: s.item.path,
        commercial: s.item.commercial,
        sponsored: {
          placementId: s.placementId,
          clickHref: s.clickHref,
          impressionToken: s.impressionToken,
        },
      }));
    }
    return {
      province: province ? { slug: province.slug, name: province.name } : null,
      modules: built
        .filter(
          (b) => b.cards.length >= b.m.minItems && (b.m.type !== 'SPONSORED' || b.cards.length),
        )
        .map((b) => ({ key: b.m.key, type: b.m.type, title: b.m.title, cards: b.cards })),
    };
  }

  private async cards(m: HomeModule, provinceId: string | null): Promise<HomeCard[]> {
    const cfg = HomeModuleConfig.safeParse(m.config);
    const c = cfg.success ? cfg.data : {};
    switch (m.type) {
      case 'CATEGORY_SHORTCUTS': {
        const cats = await this.prisma.category.findMany({
          where: { parentId: null, status: 'PUBLISHED' },
          orderBy: { sortOrder: 'asc' },
        });
        return cats.map((x) => ({
          kind: 'CATEGORY',
          id: x.id,
          title: x.name,
          subtitle: null,
          path: `/ara?kategori=${x.slug}`,
          commercial: NONE,
          sponsored: null,
        }));
      }
      case 'CITY_PICKER': {
        const rows = await this.prisma.listingLocation.groupBy({
          by: ['provinceId'],
          where: {
            listing: {
              status: 'PUBLISHED',
              deletedAt: null,
              ...(this.production ? { dataOrigin: { not: 'DEMO' } } : {}),
            },
          },
          _count: { _all: true },
          orderBy: { _count: { provinceId: 'desc' } },
          take: m.maxItems,
        });
        const areas = await this.prisma.adminArea.findMany({
          where: { id: { in: rows.map((r) => r.provinceId) } },
        });
        const byId = new Map(areas.map((a) => [a.id, a]));
        return rows.flatMap((r) => {
          const a = byId.get(r.provinceId);
          return a
            ? [
                {
                  kind: 'PLACE' as const,
                  id: a.id,
                  title: a.name,
                  subtitle: null,
                  path: `/?il=${a.slug}`,
                  commercial: NONE,
                  sponsored: null,
                },
              ]
            : [];
        });
      }
      case 'EDITORS_PICKS': {
        // Editörün seçtikleri: yalnızca organik kayıtlar; sponsorlu öğe içeremez (A8.3).
        const listings = c.listingSlugs?.length ? await this.listingCards(c.listingSlugs) : [];
        const articles = c.articleSlugs?.length
          ? await this.articleCards({ slug: { in: c.articleSlugs } }, m.maxItems)
          : [];
        return [...listings, ...articles];
      }
      case 'CATEGORY_POPULAR':
      case 'SEASONAL': {
        const category = c.categorySlug
          ? await this.prisma.category.findUnique({ where: { slug: c.categorySlug } })
          : null;
        if (!category) return [];
        const contextProvince = c.provinceSlug
          ? ((
              await this.prisma.adminArea.findFirst({
                where: { level: 'PROVINCE', slug: c.provinceSlug },
              })
            )?.id ?? null)
          : provinceId;
        const { rows } = await this.search.query({
          tokens: [],
          docTypes: ['LISTING'],
          kind: null,
          categoryId: category.id,
          provinceId: contextProvince,
          districtId: null,
          priceMax: null,
          minRating: null,
          attributes: {},
          excludeDemo: this.production,
          sort: 'rating',
          near: null,
          offset: 0,
          limit: m.maxItems,
          fuzzy: false,
          matchAny: false,
        });
        return rows
          .filter((r) => r.status === 'PUBLISHED')
          .map((r) => ({
            kind: 'LISTING' as const,
            id: r.refId,
            title: r.title,
            subtitle: r.subtitle,
            path: r.path,
            commercial: NONE,
            sponsored: null,
          }));
      }
      case 'NEW_ARTICLES':
        return this.articleCards({ type: { in: GUIDE_TYPES } }, m.maxItems);
      case 'COMPARISONS':
        return this.articleCards({ type: 'COMPARISON' }, m.maxItems);
      case 'TRUST_LINKS':
        return [
          [STATIC_PATHS.methodology, tr.footer.methodology],
          [STATIC_PATHS.independence, tr.footer.independence],
          [STATIC_PATHS.sponsoredPolicy, tr.footer.sponsoredPolicy],
          [STATIC_PATHS.corrections, tr.footer.corrections],
        ].map(([path, title]) => ({
          kind: 'LINK' as const,
          id: path!,
          title: title!,
          subtitle: null,
          path: path!,
          commercial: NONE,
          sponsored: null,
        }));
      default:
        return [];
    }
  }

  private async listingCards(slugs: string[]): Promise<HomeCard[]> {
    const listings = await this.prisma.listing.findMany({
      where: {
        slug: { in: slugs },
        status: 'PUBLISHED',
        deletedAt: null,
        ...(this.production ? { dataOrigin: { not: 'DEMO' } } : {}),
      },
      select: { id: true, slug: true },
    });
    const docs = await this.prisma.searchDocument.findMany({
      where: { docType: 'LISTING', refId: { in: listings.map((l) => l.id) } },
    });
    const bySlug = new Map(listings.map((l) => [l.slug, l.id]));
    const byId = new Map(docs.map((d) => [d.refId, d]));
    return slugs.flatMap((s) => {
      const d = byId.get(bySlug.get(s) ?? '');
      return d
        ? [
            {
              kind: 'LISTING' as const,
              id: d.refId,
              title: d.title,
              subtitle: d.subtitle,
              path: d.path,
              commercial: NONE,
              sponsored: null,
            },
          ]
        : [];
    });
  }

  private async articleCards(
    where: { type?: ArticleType | { in: ArticleType[] }; slug?: { in: string[] } },
    take: number,
  ): Promise<HomeCard[]> {
    const rows = await this.prisma.article.findMany({
      where: {
        ...where,
        status: 'PUBLISHED',
        commercialRelation: 'NONE',
        ...(this.production ? { dataOrigin: { not: 'DEMO' } } : {}),
      },
      orderBy: { publishedAt: 'desc' },
      take,
    });
    return rows.map((a) => ({
      kind: 'ARTICLE' as const,
      id: a.id,
      title: a.title,
      subtitle: a.summary,
      path: articlePath({ type: a.type, slug: a.slug }),
      commercial: NONE,
      sponsored: null,
    }));
  }

  // ── Panel ──

  async list(): Promise<{ data: AdminHomeModule[] }> {
    const rows = await this.prisma.homeModule.findMany({ orderBy: { position: 'asc' } });
    return { data: rows.map(dto) };
  }

  async update(
    ctx: AuthContext,
    id: string,
    body: z.infer<typeof HomeModuleUpdateBody>,
    meta: RequestMeta,
  ): Promise<AdminHomeModule> {
    const all = await this.prisma.homeModule.findMany();
    const current = all.find((m) => m.id === id);
    if (!current) throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Modül bulunamadı');
    const { version, ...rest } = body;
    const next = {
      ...current,
      ...rest,
      visibleFrom:
        rest.visibleFrom === undefined
          ? current.visibleFrom
          : rest.visibleFrom
            ? new Date(rest.visibleFrom)
            : null,
      visibleUntil:
        rest.visibleUntil === undefined
          ? current.visibleUntil
          : rest.visibleUntil
            ? new Date(rest.visibleUntil)
            : null,
    };
    const errors = homeRuleErrors(all.map((m) => (m.id === id ? next : m)));
    if (next.maxItems < next.minItems) errors.push('min_max');
    if (next.visibleFrom && next.visibleUntil && next.visibleUntil <= next.visibleFrom) {
      errors.push('visibility_window');
    }
    if (errors.length) throw invalid(errors);
    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.homeModule.updateMany({
        where: { id, version },
        data: {
          ...(rest.title !== undefined ? { title: rest.title } : {}),
          ...(rest.enabled !== undefined ? { enabled: rest.enabled } : {}),
          ...(rest.position !== undefined ? { position: rest.position } : {}),
          ...(rest.minItems !== undefined ? { minItems: rest.minItems } : {}),
          ...(rest.maxItems !== undefined ? { maxItems: rest.maxItems } : {}),
          ...(rest.config !== undefined ? { config: rest.config } : {}),
          ...(rest.provinceSlug !== undefined ? { provinceSlug: rest.provinceSlug } : {}),
          visibleFrom: next.visibleFrom,
          visibleUntil: next.visibleUntil,
          version: { increment: 1 },
        },
      });
      if (res.count === 0) {
        throw new ProblemException(
          HttpStatus.PRECONDITION_FAILED,
          'PRECONDITION_FAILED',
          'Modül başka bir oturumda değiştirildi',
        );
      }
      await this.audit.record(
        {
          actorId: ctx.userId,
          actorRole: ctx.roles.join(','),
          action: 'home.module.updated',
          targetType: 'home_module',
          targetId: id,
          summary: { key: current.key, fields: Object.keys(rest) },
          ipPrefix: meta.ipPrefix,
          traceId: meta.traceId,
        },
        tx,
      );
      return tx.homeModule.findUniqueOrThrow({ where: { id } });
    });
    return dto(updated);
  }
}

function dto(m: HomeModule): AdminHomeModule {
  const cfg = HomeModuleConfig.safeParse(m.config);
  return {
    id: m.id,
    key: m.key,
    type: m.type,
    title: m.title,
    source: m.source as AdminHomeModule['source'],
    position: m.position,
    enabled: m.enabled,
    minItems: m.minItems,
    maxItems: m.maxItems,
    config: cfg.success ? cfg.data : {},
    visibleFrom: m.visibleFrom?.toISOString() ?? null,
    visibleUntil: m.visibleUntil?.toISOString() ?? null,
    provinceSlug: m.provinceSlug,
    version: m.version,
  };
}
