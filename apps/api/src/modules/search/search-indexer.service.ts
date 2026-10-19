import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ArticleBody, type ArticleType, type ListingKind } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { articlePath, CAR_RENTAL_PREFIX, listingPath } from '@incelemeler/routes';
import { PrismaService } from '../../prisma/prisma.service.js';
import { OutboxService } from '../outbox/outbox.service.js';
import { SEARCH_PORT, type SearchPort } from './search.port.js';

const PUBLIC_LISTING = ['PUBLISHED', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY'];

/** Gövde bloklarından düz metin (yalnızca okunur metin; bağlantı adresleri dışarıda). */
export function articlePlainText(body: unknown): string {
  const parsed = ArticleBody.safeParse(body);
  if (!parsed.success) return '';
  const inline = (nodes: Array<{ text: string }>) => nodes.map((n) => n.text).join('');
  const out: string[] = [];
  for (const b of parsed.data) {
    switch (b.type) {
      case 'heading':
        out.push(b.text);
        break;
      case 'paragraph':
      case 'infoBox':
      case 'quote':
        out.push(inline(b.content));
        break;
      case 'list':
        out.push(...b.items.map(inline));
        break;
      case 'table':
        out.push(...b.header, ...b.rows.flat());
        break;
      case 'prosCons':
        out.push(...b.pros, ...b.cons);
        break;
      case 'faq':
        out.push(...b.items.flatMap((q) => [q.question, inline(q.answer)]));
        break;
      default:
        break;
    }
  }
  return out.join(' ');
}

/**
 * search_documents okuma modelini güncel tutar (REQ-ARA-002): outbox olaylarını dinler; her olayda
 * kaydın güncel hâlini okur (olay yükü değil, veritabanı doğruluk kaynağıdır). Yayında olmayan kayıt silinir.
 */
@Injectable()
export class SearchIndexerService implements OnModuleInit {
  private readonly logger = new Logger('SearchIndexer');

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    @Inject(SEARCH_PORT) private readonly search: SearchPort,
  ) {}

  onModuleInit(): void {
    for (const type of [
      'catalog.listing.created',
      'catalog.listing.updated',
      'catalog.listing.status_changed',
      'catalog.listing.deleted',
    ]) {
      this.outbox.register(type, (e) => this.indexListing(e.aggregateId));
    }
    for (const type of [
      'editorial.article.published',
      'editorial.article.unpublished',
      'editorial.article.updated',
    ]) {
      this.outbox.register(type, (e) => this.indexArticle(e.aggregateId));
    }
    for (const type of ['taxonomy.category.created', 'taxonomy.category.updated']) {
      this.outbox.register(type, (e) => this.onCategoryChanged(e.aggregateId));
    }
  }

  async indexListing(id: string): Promise<void> {
    const l = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        primaryCategory: true,
        secondaryCategories: true,
        location: { include: { province: true, district: true } },
        product: true,
      },
    });
    if (!l || l.deletedAt || !PUBLIC_LISTING.includes(l.status)) {
      await this.search.delete('LISTING', id);
      return;
    }
    const chain = await this.categoryChains([
      l.primaryCategoryId,
      ...l.secondaryCategories.map((c) => c.categoryId),
    ]);
    const primaryChain = chain.get(l.primaryCategoryId) ?? [];
    const carRental = primaryChain.some((c) => c.slug === CAR_RENTAL_PREFIX);
    const categoryIds = [...new Set([...chain.values()].flat().map((c) => c.id))];
    const categoryNames = [...new Set([...chain.values()].flat().map((c) => c.name))];
    const loc = l.location;
    const place = loc ? [loc.district?.name, loc.province.name].filter(Boolean).join(', ') : null;
    const attrText = Object.values(l.attributes as Record<string, unknown>)
      .filter((v): v is string | string[] => typeof v === 'string' || Array.isArray(v))
      .flat()
      .join(' ');
    await this.search.upsert({
      docType: 'LISTING',
      refId: l.id,
      title: l.name,
      subtitle: [l.primaryCategory.name, place].filter(Boolean).join(' · ') || null,
      path: listingPath({ kind: l.kind as ListingKind, slug: l.slug, carRental }),
      text: {
        a: [l.name, l.product ? `${l.product.brand} ${l.product.model}` : ''].join(' '),
        b: [
          ...categoryNames,
          loc?.district?.name ?? '',
          loc?.province.name ?? '',
          loc?.neighborhood ?? '',
        ].join(' '),
        c: l.shortDescription ?? '',
        d: attrText,
      },
      kind: l.kind as ListingKind,
      articleType: null,
      categoryIds,
      provinceId: loc?.provinceId ?? null,
      districtId: loc?.districtId ?? null,
      priceLevel: l.priceLevel,
      attributes: l.attributes as Record<string, unknown>,
      status: l.status,
      dataOrigin: l.dataOrigin,
      ratingCount: 0,
      ratingAvg: null,
      ratingBayes: null,
      lat: loc?.latitude ? Number(loc.latitude) : null,
      lng: loc?.longitude ? Number(loc.longitude) : null,
      publishedAt: l.publishedAt,
    });
  }

  async indexArticle(id: string): Promise<void> {
    const a = await this.prisma.article.findUnique({ where: { id } });
    if (!a || a.deletedAt || a.status !== 'PUBLISHED') {
      await this.search.delete('ARTICLE', id);
      return;
    }
    const type = a.type as ArticleType;
    await this.search.upsert({
      docType: 'ARTICLE',
      refId: a.id,
      title: a.title,
      subtitle: tr.article.typePlural[type],
      path: articlePath({ type, slug: a.slug }),
      text: { a: a.title, b: '', c: a.summary ?? '', d: articlePlainText(a.body) },
      kind: null,
      articleType: type,
      categoryIds: [],
      provinceId: null,
      districtId: null,
      priceLevel: null,
      attributes: {},
      status: a.status,
      dataOrigin: a.dataOrigin,
      ratingCount: 0,
      ratingAvg: null,
      ratingBayes: null,
      lat: null,
      lng: null,
      publishedAt: a.lastSignificantUpdateAt ?? a.publishedAt,
    });
  }

  /** Kategori belgesi (öneriler) + ad/yol değişikliği o kategorideki listelemelere yansır. */
  async onCategoryChanged(id: string): Promise<void> {
    await this.indexCategory(id);
    const listings = await this.prisma.listing.findMany({
      where: {
        deletedAt: null,
        OR: [{ primaryCategoryId: id }, { secondaryCategories: { some: { categoryId: id } } }],
      },
      select: { id: true },
    });
    for (const l of listings) await this.indexListing(l.id);
  }

  async indexCategory(id: string): Promise<void> {
    const c = await this.prisma.category.findUnique({ where: { id }, include: { parent: true } });
    if (!c || c.status !== 'PUBLISHED') {
      await this.search.delete('CATEGORY', id);
      return;
    }
    await this.search.upsert({
      ...emptyDoc,
      docType: 'CATEGORY',
      refId: c.id,
      title: c.name,
      subtitle: c.parent?.name ?? null,
      path: `/ara?kategori=${c.slug}`,
      text: { a: c.name, b: c.parent?.name ?? '', c: '', d: '' },
      categoryIds: [c.id],
      dataOrigin: c.dataOrigin,
    });
  }

  async indexPlaces(): Promise<number> {
    const areas = await this.prisma.adminArea.findMany({ include: { parent: true } });
    for (const a of areas) {
      const province = a.level === 'PROVINCE' ? a : a.parent;
      if (!province) continue;
      await this.search.upsert({
        ...emptyDoc,
        docType: 'PLACE',
        refId: a.id,
        title: a.name,
        subtitle: a.level === 'DISTRICT' ? province.name : null,
        path:
          a.level === 'PROVINCE' ? `/ara?il=${a.slug}` : `/ara?il=${province.slug}&ilce=${a.slug}`,
        text: { a: a.name, b: a.level === 'DISTRICT' ? province.name : '', c: '', d: '' },
        provinceId: province.id,
        districtId: a.level === 'DISTRICT' ? a.id : null,
        dataOrigin: 'EDITORIAL',
      });
    }
    return areas.length;
  }

  /** Tam yeniden indeksleme (`pnpm --filter @incelemeler/api search:reindex`). */
  async reindexAll(): Promise<{
    listings: number;
    articles: number;
    categories: number;
    places: number;
  }> {
    await this.prisma.$executeRaw`DELETE FROM search_documents`;
    const listings = await this.prisma.listing.findMany({
      where: {
        deletedAt: null,
        status: { in: ['PUBLISHED', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY'] },
      },
      select: { id: true },
    });
    for (const l of listings) await this.indexListing(l.id);
    const articles = await this.prisma.article.findMany({
      where: { deletedAt: null, status: 'PUBLISHED' },
      select: { id: true },
    });
    for (const a of articles) await this.indexArticle(a.id);
    const categories = await this.prisma.category.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true },
    });
    for (const c of categories) await this.indexCategory(c.id);
    const places = await this.indexPlaces();
    this.logger.log(
      JSON.stringify({
        event: 'search.reindexed',
        listings: listings.length,
        articles: articles.length,
      }),
    );
    return {
      listings: listings.length,
      articles: articles.length,
      categories: categories.length,
      places,
    };
  }

  /** Kategori kimliği → kök'e kadar zincir (kendisi dahil). */
  private async categoryChains(ids: string[]) {
    const all = await this.prisma.category.findMany({
      select: { id: true, slug: true, name: true, parentId: true },
    });
    const byId = new Map(all.map((c) => [c.id, c]));
    const out = new Map<string, Array<{ id: string; slug: string; name: string }>>();
    for (const id of ids) {
      const chain: Array<{ id: string; slug: string; name: string }> = [];
      let cur = byId.get(id);
      while (cur && chain.length < 10) {
        chain.push({ id: cur.id, slug: cur.slug, name: cur.name });
        cur = cur.parentId ? byId.get(cur.parentId) : undefined;
      }
      out.set(id, chain);
    }
    return out;
  }
}

const emptyDoc = {
  subtitle: null,
  kind: null,
  articleType: null,
  categoryIds: [] as string[],
  provinceId: null,
  districtId: null,
  priceLevel: null,
  attributes: {},
  status: null,
  ratingCount: 0,
  ratingAvg: null,
  ratingBayes: null,
  lat: null,
  lng: null,
  publishedAt: null,
};
