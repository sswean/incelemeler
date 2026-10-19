import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import type {
  SearchFilters,
  SearchInterpretation,
  SearchQuery,
  SearchResponse,
  SuggestResponse,
} from '@incelemeler/contracts';
import { normalizeTr } from '@incelemeler/utils';
import { ProblemException } from '../../common/problem.js';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import { SponsoredServingService } from '../sponsorship/sponsored-serving.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { mergeIntentFilters, parseQuery } from './query-parser.js';
import { SearchLexiconService } from './search-lexicon.service.js';
import { SEARCH_PORT, type SearchCriteria, type SearchPort } from './search.port.js';

/** Tam metin sonucu bundan azsa benzerlik geri dönüşü denenir (REQ-ARA-005). */
const FUZZY_BELOW = 5;

const invalid = (pointer: string, message: string) =>
  new ProblemException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'VALIDATION_FAILED',
    'İstek doğrulanamadı',
    undefined,
    [{ pointer, code: 'INVALID_VALUE', message }],
  );

type Relaxable = { drop: string; label: string; apply: (c: SearchCriteria) => SearchCriteria };

/**
 * Arama (REQ-ARA-001…014): sorgu ayrıştırma → yapılandırılmış ölçüt → SearchPort. Organik sıralama
 * kampanyalardan bağımsızdır; bu servis hiçbir ticari tabloyu okumaz (AK-04, REQ-ARA-009).
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger('Search');

  constructor(
    private readonly prisma: PrismaService,
    private readonly lexicon: SearchLexiconService,
    @Inject(SEARCH_PORT) private readonly port: SearchPort,
    @Inject(ENV) private readonly env: EnvToken,
    private readonly sponsored: SponsoredServingService,
  ) {}

  private get excludeDemo() {
    return this.env.APP_ENV === 'production';
  }

  async search(q: SearchQuery): Promise<SearchResponse> {
    if ((q.lat === undefined) !== (q.lng === undefined)) {
      throw invalid('/query/lat', 'Enlem ve boylam birlikte verilmeli');
    }
    if (q.sort === 'nearest' && q.lat === undefined) {
      throw invalid('/query/sort', '"En yakın" sıralaması konum gerektirir');
    }
    if (q.district && !q.province) throw invalid('/query/district', 'İlçe için il gerekli');

    const lex = await this.lexicon.get();
    const parsed =
      q.q && q.interpret
        ? parseQuery(q.q, lex)
        : {
            place: null,
            category: null,
            intents: [],
            text: q.q ? normalizeTr(q.q).folded.split(' ').filter(Boolean) : [],
            didYouMean: null,
          };

    // Açık parametreler ayrıştırıcının bulduğunun önüne geçer.
    const province = q.province ? await this.areaBySlug(q.province, null) : null;
    const district = q.district && province ? await this.areaBySlug(q.district, province.id) : null;
    const category = q.category ? await this.categoryBySlug(q.category) : null;
    const parsedPlace = province ? null : parsed.place;
    const parsedCategory = category ? null : parsed.category;
    const intentFilter = mergeIntentFilters(parsed.intents);
    const explicitAttrs = await this.attributeFilters(
      q.attr === undefined ? [] : Array.isArray(q.attr) ? q.attr : [q.attr],
    );
    const intentAttrs = await this.typedAttributes(intentFilter.attributes ?? {});

    const criteria: SearchCriteria = {
      tokens: parsed.text,
      docTypes: q.type ? [q.type] : q.kind ? ['LISTING'] : ['LISTING', 'ARTICLE'],
      kind: q.kind ?? null,
      categoryId: category?.id ?? parsedCategory?.id ?? null,
      provinceId: province?.id ?? parsedPlace?.provinceId ?? null,
      districtId:
        district?.id ?? (parsedPlace?.level === 'DISTRICT' ? parsedPlace.id : null) ?? null,
      priceMax: q.priceMax ?? intentFilter.priceLevelMax ?? null,
      minRating: q.minRating ? Number(q.minRating) : null,
      attributes: { ...intentAttrs, ...explicitAttrs },
      excludeDemo: this.excludeDemo,
      sort: q.sort,
      near: q.lat !== undefined && q.lng !== undefined ? { lat: q.lat, lng: q.lng } : null,
      offset: (q.page - 1) * q.pageSize,
      limit: q.pageSize,
      fuzzy: false,
      matchAny: false,
    };
    // Yer/kategori filtresi varken (ör. "İstanbul'da kahvaltı") kategori/yer belgeleri sonuçta gereksiz.
    if (criteria.categoryId || criteria.provinceId || criteria.priceMax !== null) {
      criteria.docTypes = criteria.docTypes.filter((t) => t === 'LISTING');
      if (!criteria.docTypes.length) criteria.docTypes = ['LISTING'];
    }

    let { rows, total } = await this.port.query(criteria);
    // (1) Tüm kelimeler birlikte sonuç vermiyorsa herhangi biri ("balon ve çevre turları").
    if (total === 0 && criteria.tokens.length > 1) {
      criteria.matchAny = true;
      ({ rows, total } = await this.port.query(criteria));
    }
    // (2) Ayrıştırıcının bulduğu alt kategori sonuçsuzsa kök kategoriye genişlet ("otel" → Konaklama).
    let shownCategory = parsedCategory;
    if (total === 0 && parsedCategory) {
      const root = await this.rootCategory(parsedCategory.id);
      if (root.id !== parsedCategory.id) {
        const widened = await this.port.query({ ...criteria, categoryId: root.id });
        if (widened.total > 0) {
          ({ rows, total } = widened);
          criteria.categoryId = root.id;
          shownCategory = { id: root.id, slug: root.slug, name: root.name };
        }
      }
    }
    // (3) Ayrıştırıcının yer saydığı kelime sonuçsuzsa metin olarak dene ("menemen" ilçe mi, yemek mi?).
    let shownPlace = parsedPlace;
    if (total === 0 && parsedPlace) {
      const asText = await this.port.query({
        ...criteria,
        provinceId: province?.id ?? null,
        districtId: district?.id ?? null,
        tokens: [...criteria.tokens, ...normalizeTr(parsedPlace.name).folded.split(' ')],
      });
      if (asText.total > 0) {
        ({ rows, total } = asText);
        criteria.provinceId = province?.id ?? null;
        criteria.districtId = district?.id ?? null;
        criteria.tokens = [...criteria.tokens, ...normalizeTr(parsedPlace.name).folded.split(' ')];
        shownPlace = null;
      }
    }
    let fuzzyFallback = false;
    let didYouMean = parsed.didYouMean;
    if (total < FUZZY_BELOW && criteria.tokens.length && q.page === 1) {
      const fuzzy = await this.port.query({ ...criteria, fuzzy: true });
      const seen = new Set(rows.map((r) => r.refId));
      const extra = fuzzy.rows.filter((r) => !seen.has(r.refId));
      if (extra.length) {
        fuzzyFallback = true;
        rows = [...rows, ...extra].slice(0, criteria.limit);
        total = total + extra.length;
        if (!didYouMean && total === extra.length) didYouMean = extra[0]!.title;
      }
    }

    const interpretation: SearchInterpretation = {
      place: shownPlace
        ? await this.placeChip(shownPlace.id, shownPlace.level, shownPlace.corrected)
        : null,
      category: shownCategory ? { slug: shownCategory.slug, name: shownCategory.name } : null,
      intents: parsed.intents.map((i) => ({
        key: i.id,
        label: i.label,
        priceMax: i.filter.priceLevelMax ?? null,
        attrs: Object.entries(i.filter.attributes ?? {}).map(([k, v]) => `${k}:${String(v)}`),
      })),
      text: criteria.tokens.length ? criteria.tokens.join(' ') : null,
      didYouMean,
    };

    const relaxations =
      total === 0
        ? await this.relaxations(criteria, {
            place: province?.name ?? parsedPlace?.name ?? null,
            category: category?.name ?? parsedCategory?.name ?? null,
          })
        : [];

    await this.recordEvent(q, criteria, total);
    // Sponsorlu yerleşimler organik sonuçtan sonra ve ondan bağımsız hesaplanır (REQ-SPN-002, REQ-ARA-009).
    // Yalnızca içerik aranırken (type=ARTICLE) listeleme yerleşimi gösterilmez.
    const sponsored = criteria.docTypes.includes('LISTING')
      ? await this.sponsored.forList({
          surface: 'SEARCH',
          criteria,
          organicCount: rows.length,
          categoryId: criteria.categoryId,
          provinceId: criteria.provinceId,
        })
      : [];
    return {
      data: rows.map((r) => ({
        type: r.docType,
        id: r.refId,
        title: r.title,
        subtitle: r.subtitle,
        path: r.path,
        kind: r.kind,
        articleType: r.articleType,
        status: r.status,
        priceLevel: r.priceLevel,
        ratingCount: r.ratingCount,
        distanceKm: r.distanceKm,
        dataOrigin: r.dataOrigin,
        commercial: { type: 'NONE' as const },
      })),
      sponsored,
      total,
      page: q.page,
      pageSize: q.pageSize,
      sort: q.sort,
      interpretation,
      fuzzyFallback,
      relaxations,
    };
  }

  async suggest(raw: string): Promise<SuggestResponse> {
    const tokens = normalizeTr(raw).folded.split(' ').filter(Boolean);
    const rows = await this.port.suggest(tokens, 5, this.excludeDemo);
    const pick = (t: string) =>
      rows
        .filter((r) => r.docType === t)
        .map((r) => ({ title: r.title, subtitle: r.subtitle, path: r.path }));
    return {
      places: pick('PLACE'),
      categories: pick('CATEGORY'),
      listings: pick('LISTING'),
      articles: pick('ARTICLE'),
    };
  }

  async filters(): Promise<SearchFilters> {
    const defs = await this.prisma.attributeDefinition.findMany({
      where: {
        filterable: true,
        archivedAt: null,
        type: { in: ['BOOL', 'ENUM', 'MULTI_ENUM', 'INT', 'DECIMAL'] },
        category: { status: 'PUBLISHED' },
      },
      include: { category: { select: { slug: true } } },
      orderBy: [{ sortOrder: 'asc' }, { key: 'asc' }],
    });
    const byKey = new Map<string, SearchFilters['attributes'][number]>();
    for (const d of defs) {
      const existing = byKey.get(d.key);
      if (existing) {
        existing.categories.push(d.category.slug);
        continue;
      }
      byKey.set(d.key, {
        key: d.key,
        label: d.label,
        type: d.type as SearchFilters['attributes'][number]['type'],
        options: (d.options as Array<{ value: string; label: string }>) ?? [],
        categories: [d.category.slug],
      });
    }
    return { attributes: [...byKey.values()] };
  }

  /** Sıfır sonuçta her filtre tek tek gevşetilip sonuç sayısı ölçülür (REQ-ARA-013). */
  private async relaxations(
    c: SearchCriteria,
    names: { place: string | null; category: string | null },
  ) {
    const options: Relaxable[] = [];
    if (c.provinceId && names.place) {
      options.push({
        drop: 'place',
        label: names.place,
        apply: (x) => ({ ...x, provinceId: null, districtId: null }),
      });
    }
    if (c.categoryId && names.category) {
      options.push({
        drop: 'category',
        label: names.category,
        apply: (x) => ({ ...x, categoryId: null }),
      });
    }
    if (c.priceMax !== null) {
      options.push({
        drop: 'priceMax',
        label: '₺'.repeat(c.priceMax),
        apply: (x) => ({ ...x, priceMax: null }),
      });
    }
    if (c.minRating !== null) {
      options.push({
        drop: 'minRating',
        label: String(c.minRating),
        apply: (x) => ({ ...x, minRating: null }),
      });
    }
    for (const key of Object.keys(c.attributes)) {
      options.push({
        drop: `attr:${key}`,
        label: key,
        apply: (x) => {
          const { [key]: _removed, ...rest } = x.attributes;
          return { ...x, attributes: rest };
        },
      });
    }
    if (c.tokens.length) {
      options.push({
        drop: 'text',
        label: c.tokens.join(' '),
        apply: (x) => ({ ...x, tokens: [] }),
      });
    }
    const out = [];
    for (const o of options) {
      const { total } = await this.port.query({ ...o.apply(c), offset: 0, limit: 1 });
      if (total > 0) out.push({ drop: o.drop, label: o.label, count: total });
    }
    return out;
  }

  private async areaBySlug(slug: string, parentId: string | null) {
    const a = await this.prisma.adminArea.findFirst({
      where: parentId ? { slug, parentId } : { slug, level: 'PROVINCE' },
    });
    if (!a) throw invalid(parentId ? '/query/district' : '/query/province', 'Bilinmeyen yer');
    return a;
  }

  private async categoryBySlug(slug: string) {
    const c = await this.prisma.category.findFirst({ where: { slug, status: 'PUBLISHED' } });
    if (!c) throw invalid('/query/category', 'Bilinmeyen kategori');
    return c;
  }

  private async rootCategory(id: string) {
    let c = await this.prisma.category.findUniqueOrThrow({ where: { id } });
    for (let i = 0; i < 10 && c.parentId; i++) {
      c = await this.prisma.category.findUniqueOrThrow({ where: { id: c.parentId } });
    }
    return c;
  }

  private async placeChip(id: string, level: 'PROVINCE' | 'DISTRICT', corrected: boolean) {
    const a = await this.prisma.adminArea.findUniqueOrThrow({
      where: { id },
      include: { parent: true },
    });
    const province = level === 'PROVINCE' ? a : a.parent!;
    return {
      name: a.name,
      level,
      province: province.slug,
      district: level === 'DISTRICT' ? a.slug : null,
      corrected,
    };
  }

  /** `anahtar:değer` filtreleri yalnızca filtrelenebilir özellikler için; türüne göre JSON koşulu. */
  private async attributeFilters(pairs: string[]): Promise<Record<string, unknown>> {
    if (!pairs.length) return {};
    const parsed = Object.fromEntries(
      pairs.map((p) => {
        const i = p.indexOf(':');
        return [p.slice(0, i), p.slice(i + 1)];
      }),
    );
    const defs = await this.prisma.attributeDefinition.findMany({
      where: { key: { in: Object.keys(parsed) }, filterable: true, archivedAt: null },
    });
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const def = defs.find((d) => d.key === key);
      if (!def) throw invalid('/query/attr', `Filtrelenemeyen özellik: ${key}`);
      out[key] = typed(def.type, value);
      if (out[key] === undefined) throw invalid('/query/attr', `Geçersiz değer: ${key}`);
    }
    return out;
  }

  private async typedAttributes(attrs: Record<string, string | boolean>) {
    const keys = Object.keys(attrs);
    if (!keys.length) return {};
    const defs = await this.prisma.attributeDefinition.findMany({
      where: { key: { in: keys }, archivedAt: null },
    });
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(attrs)) {
      const def = defs.find((d) => d.key === key);
      const v = def ? typed(def.type, String(value)) : value;
      if (v !== undefined) out[key] = v;
    }
    return out;
  }

  /** Arama olayı (REQ-ARA-014): kişisel veri ve oturum karması yok (rıza altyapısı D10'da). */
  private async recordEvent(q: SearchQuery, c: SearchCriteria, total: number) {
    if (!q.q && !c.categoryId && !c.provinceId) return;
    try {
      await this.prisma.searchEvent.create({
        data: {
          queryNorm: q.q ? normalizeTr(q.q).folded.slice(0, 200) : '',
          filters: {
            province: c.provinceId,
            district: c.districtId,
            category: c.categoryId,
            kind: c.kind,
            priceMax: c.priceMax,
            attrs: Object.keys(c.attributes),
            sort: c.sort,
            page: q.page,
          },
          resultCount: total,
        },
      });
    } catch (e) {
      this.logger.warn(JSON.stringify({ event: 'search.event_failed', message: String(e) }));
    }
  }
}

function typed(type: string, value: string): unknown {
  switch (type) {
    case 'BOOL':
      return value === 'true' ? true : value === 'false' ? false : undefined;
    case 'ENUM':
      return value;
    case 'MULTI_ENUM':
      return [value];
    case 'INT':
    case 'DECIMAL': {
      const n = Number(value);
      return Number.isFinite(n) ? n : undefined;
    }
    default:
      return undefined;
  }
}
