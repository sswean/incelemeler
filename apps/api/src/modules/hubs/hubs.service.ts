import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  ArticleBody,
  type ArticleType,
  type Hub,
  type HubQuery,
  type PublicationThresholds,
} from '@incelemeler/contracts';
import { hubPath } from '@incelemeler/routes';
import { ProblemException } from '../../common/problem.js';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { referencedIds } from '../editorial/article-rules.js';
import { SEARCH_PORT, type SearchPort } from '../search/search.port.js';
import { ThresholdsService } from './thresholds.service.js';

const PAGE_SIZE = 24;
const TTL_MS = 60_000;

interface Area {
  id: string;
  slug: string;
  name: string;
}
interface SnapListing {
  id: string;
  districtId: string | null;
  categoryIds: Set<string>;
  demo: boolean;
  publishedAt: Date | null;
}
interface SnapArticle {
  id: string;
  type: ArticleType;
  slug: string;
  title: string;
  summary: string | null;
  publishedAt: Date | null;
  listingIds: Set<string>;
}
interface Snapshot {
  province: Area;
  districts: Map<string, Area>;
  categories: Map<string, Area & { parentId: string | null }>;
  listings: SnapListing[];
  articles: SnapArticle[];
}

const notFound = () => new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Sayfa bulunamadı');

/**
 * Destinasyon ve keşif hub'ları (Ek A15.1, §7.2): il, ilçe, il × kategori, ilçe × kategori.
 * Yayın eşiğinin altındaki hub üretilmez (404) ve site haritasına girmez (REQ-KAT-003, REQ-SEO-006).
 * "Editoryal içerik" sayımı: hub'ın listelemelerinden en az birini gömülü kart olarak içeren yayımlanmış içerik (A-018).
 */
@Injectable()
export class HubsService {
  private readonly cache = new Map<string, { at: number; snap: Snapshot }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly thresholds: ThresholdsService,
    @Inject(SEARCH_PORT) private readonly search: SearchPort,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  private get production() {
    return this.env.APP_ENV === 'production';
  }

  async get(q: HubQuery): Promise<Hub> {
    const province = await this.prisma.adminArea.findFirst({
      where: { level: 'PROVINCE', slug: q.province },
    });
    if (!province) throw notFound();
    const snap = await this.snapshot(province);
    const t = await this.thresholds.get();
    const ev = new Evaluator(snap, t);

    let district: Area | null = null;
    let category: (Area & { parentId: string | null }) | null = null;
    if (q.segment) {
      district = [...snap.districts.values()].find((d) => d.slug === q.segment) ?? null;
      if (!district) {
        if (q.category) throw notFound();
        category = [...snap.categories.values()].find((c) => c.slug === q.segment) ?? null;
        if (!category) throw notFound();
      } else if (q.category) {
        category = [...snap.categories.values()].find((c) => c.slug === q.category) ?? null;
        if (!category) throw notFound();
      }
    } else if (q.category) {
      throw notFound();
    }

    const kind: Hub['kind'] = district
      ? category
        ? 'DISTRICT_CATEGORY'
        : 'DISTRICT'
      : category
        ? 'PROVINCE_CATEGORY'
        : 'PROVINCE';
    if (!ev.ok(kind, district?.id ?? null, category?.id ?? null)) throw notFound();

    const listings = ev.listings(district?.id ?? null, category?.id ?? null);
    const listingIds = new Set(listings.map((l) => l.id));
    const articles = snap.articles
      .filter((a) => [...a.listingIds].some((id) => listingIds.has(id)))
      .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));

    const { rows } = await this.search.query({
      tokens: [],
      docTypes: ['LISTING'],
      kind: null,
      categoryId: category?.id ?? null,
      provinceId: province.id,
      districtId: district?.id ?? null,
      priceMax: null,
      minRating: null,
      attributes: {},
      excludeDemo: this.production,
      sort: 'recommended',
      near: null,
      offset: (q.page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
      fuzzy: false,
      matchAny: false,
    });

    const p = { slug: province.slug, name: province.name };
    const link = (d: Area | null, c: Area | null, count: number) => ({
      path: hubPath({ province: province.slug, district: d?.slug, category: c?.slug }),
      label: c && d ? `${d.name} · ${c.name}` : (c?.name ?? d?.name ?? province.name),
      count,
    });
    const children: Hub['children'] = [];
    const parents: Hub['parents'] = [];
    if (kind === 'PROVINCE') {
      for (const c of ev.okCategories(null))
        children.push(link(null, c, ev.listings(null, c.id).length));
      for (const d of snap.districts.values()) {
        if (ev.ok('DISTRICT', d.id, null))
          children.push(link(d, null, ev.listings(d.id, null).length));
      }
    } else if (kind === 'PROVINCE_CATEGORY') {
      for (const c of ev.okCategories(null)) {
        if (c.parentId === category!.id)
          children.push(link(null, c, ev.listings(null, c.id).length));
      }
      for (const d of snap.districts.values()) {
        if (ev.ok('DISTRICT_CATEGORY', d.id, category!.id)) {
          children.push(link(d, category, ev.listings(d.id, category!.id).length));
        }
      }
      if (ev.ok('PROVINCE', null, null))
        parents.push(link(null, null, ev.listings(null, null).length));
    } else if (kind === 'DISTRICT') {
      for (const c of ev.okCategories(district!.id)) {
        children.push(link(district, c, ev.listings(district!.id, c.id).length));
      }
      if (ev.ok('PROVINCE', null, null))
        parents.push(link(null, null, ev.listings(null, null).length));
    } else {
      if (ev.ok('PROVINCE', null, null))
        parents.push(link(null, null, ev.listings(null, null).length));
      if (ev.ok('DISTRICT', district!.id, null)) {
        parents.push(link(district, null, ev.listings(district!.id, null).length));
      }
      if (ev.ok('PROVINCE_CATEGORY', null, category!.id)) {
        parents.push(link(null, category, ev.listings(null, category!.id).length));
      }
    }
    const dates = [...listings, ...articles].map((x) => x.publishedAt?.getTime() ?? 0);
    const lastmod = dates.length ? Math.max(...dates) : 0;
    return {
      kind,
      path: hubPath({
        province: province.slug,
        district: district?.slug,
        category: category?.slug,
      }),
      province: p,
      district: district ? { slug: district.slug, name: district.name } : null,
      category: category ? { slug: category.slug, name: category.name } : null,
      listingCount: listings.length,
      listings: rows.map((r) => ({
        type: 'LISTING' as const,
        id: r.refId,
        title: r.title,
        subtitle: r.subtitle,
        path: r.path,
        kind: r.kind,
        articleType: null,
        status: r.status,
        priceLevel: r.priceLevel,
        ratingCount: r.ratingCount,
        distanceKm: null,
        dataOrigin: r.dataOrigin,
      })),
      page: q.page,
      pageSize: PAGE_SIZE,
      articles: articles.slice(0, 6).map((a) => ({
        type: a.type,
        slug: a.slug,
        title: a.title,
        summary: a.summary,
      })),
      children: children.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'tr')),
      parents,
      demoOnly: listings.every((l) => l.demo),
      lastmod: lastmod ? new Date(lastmod).toISOString() : null,
    };
  }

  /** Eşiği sağlayan, demo olmayan listelemesi bulunan hub'lar (REQ-SEO-006). */
  async sitemap(): Promise<{ data: Array<{ path: string; lastmod: string }> }> {
    const provinceIds = await this.prisma.listingLocation.findMany({
      where: { listing: { status: 'PUBLISHED', deletedAt: null, dataOrigin: { not: 'DEMO' } } },
      distinct: ['provinceId'],
      select: { provinceId: true },
    });
    const t = await this.thresholds.get();
    const out: Array<{ path: string; lastmod: string }> = [];
    for (const { provinceId } of provinceIds) {
      const province = await this.prisma.adminArea.findUniqueOrThrow({ where: { id: provinceId } });
      const snap = await this.snapshot(province);
      // Site haritası demo kayıtlarını hiç saymaz (AK-03).
      const ev = new Evaluator({ ...snap, listings: snap.listings.filter((l) => !l.demo) }, t);
      const add = (d: Area | null, c: Area | null) => {
        const ls = ev.listings(d?.id ?? null, c?.id ?? null);
        const max = Math.max(0, ...ls.map((l) => l.publishedAt?.getTime() ?? 0));
        out.push({
          path: hubPath({ province: province.slug, district: d?.slug, category: c?.slug }),
          lastmod: new Date(max || Date.now()).toISOString(),
        });
      };
      if (ev.ok('PROVINCE', null, null)) add(null, null);
      for (const c of ev.okCategories(null)) add(null, c);
      for (const d of snap.districts.values()) {
        if (ev.ok('DISTRICT', d.id, null)) add(d, null);
        for (const c of ev.okCategories(d.id)) add(d, c);
      }
    }
    return { data: out };
  }

  private async snapshot(province: Area): Promise<Snapshot> {
    const hit = this.cache.get(province.id);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.snap;
    const [districts, categories, listings] = await Promise.all([
      this.prisma.adminArea.findMany({ where: { parentId: province.id } }),
      this.prisma.category.findMany({
        where: { status: 'PUBLISHED' },
        select: { id: true, slug: true, name: true, parentId: true },
      }),
      this.prisma.listing.findMany({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          location: { provinceId: province.id },
          ...(this.production ? { dataOrigin: { not: 'DEMO' } } : {}),
        },
        select: {
          id: true,
          primaryCategoryId: true,
          dataOrigin: true,
          publishedAt: true,
          location: { select: { districtId: true } },
          secondaryCategories: { select: { categoryId: true } },
        },
      }),
    ]);
    const catMap = new Map(categories.map((c) => [c.id, c]));
    const ancestors = (id: string) => {
      const out: string[] = [];
      for (
        let c = catMap.get(id);
        c && out.length < 10;
        c = c.parentId ? catMap.get(c.parentId) : undefined
      ) {
        out.push(c.id);
      }
      return out;
    };
    const snapListings: SnapListing[] = listings.map((l) => ({
      id: l.id,
      districtId: l.location?.districtId ?? null,
      categoryIds: new Set(
        [l.primaryCategoryId, ...l.secondaryCategories.map((s) => s.categoryId)].flatMap(ancestors),
      ),
      demo: l.dataOrigin === 'DEMO',
      publishedAt: l.publishedAt,
    }));
    const inProvince = new Set(snapListings.map((l) => l.id));
    const articleRows = await this.prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        ...(this.production ? { dataOrigin: { not: 'DEMO' } } : {}),
      },
      select: {
        id: true,
        type: true,
        slug: true,
        title: true,
        summary: true,
        publishedAt: true,
        body: true,
      },
    });
    const articles: SnapArticle[] = [];
    for (const a of articleRows) {
      const body = ArticleBody.safeParse(a.body);
      if (!body.success) continue;
      const ids = referencedIds(body.data).listingIds.filter((id) => inProvince.has(id));
      if (ids.length) {
        articles.push({ ...a, type: a.type as ArticleType, listingIds: new Set(ids) });
      }
    }
    const snap: Snapshot = {
      province: { id: province.id, slug: province.slug, name: province.name },
      districts: new Map(districts.map((d) => [d.id, { id: d.id, slug: d.slug, name: d.name }])),
      categories: catMap,
      listings: snapListings,
      articles,
    };
    this.cache.set(province.id, { at: Date.now(), snap });
    return snap;
  }
}

/** Eşik değerlendirmesi (saf; tek anlık görüntü üzerinde). */
class Evaluator {
  constructor(
    private readonly s: Snapshot,
    private readonly t: PublicationThresholds,
  ) {}

  listings(districtId: string | null, categoryId: string | null): SnapListing[] {
    return this.s.listings.filter(
      (l) =>
        (districtId === null || l.districtId === districtId) &&
        (categoryId === null || l.categoryIds.has(categoryId)),
    );
  }

  private articleCount(ls: SnapListing[], type?: ArticleType): number {
    const ids = new Set(ls.map((l) => l.id));
    return this.s.articles.filter(
      (a) => (!type || a.type === type) && [...a.listingIds].some((id) => ids.has(id)),
    ).length;
  }

  okCategories(districtId: string | null) {
    const ids = new Set(this.listings(districtId, null).flatMap((l) => [...l.categoryIds]));
    return [...ids]
      .map((id) => this.s.categories.get(id))
      .filter((c): c is NonNullable<typeof c> => !!c)
      .filter((c) =>
        this.ok(districtId ? 'DISTRICT_CATEGORY' : 'PROVINCE_CATEGORY', districtId, c.id),
      );
  }

  ok(kind: Hub['kind'], districtId: string | null, categoryId: string | null): boolean {
    const t = this.t;
    switch (kind) {
      case 'PROVINCE_CATEGORY': {
        const ls = this.listings(null, categoryId);
        return (
          ls.length > 0 &&
          ls.length >= t.provinceCategoryListings &&
          this.articleCount(ls) >= t.provinceCategoryArticles
        );
      }
      case 'DISTRICT_CATEGORY': {
        const n = this.listings(districtId, categoryId).length;
        return n > 0 && n >= t.districtCategoryListings;
      }
      case 'DISTRICT': {
        const n = this.listings(districtId, null).length;
        return n > 0 && n >= t.districtListings;
      }
      case 'PROVINCE': {
        const ls = this.listings(null, null);
        return (
          ls.length > 0 &&
          this.articleCount(ls, 'GUIDE') >= t.provinceGuides &&
          this.okCategories(null).length >= t.provinceHubs
        );
      }
    }
  }
}
