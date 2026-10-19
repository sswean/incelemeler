import { z } from 'zod';
import { ArticleType } from './content.js';
import { ListingKind } from './taxonomy.js';

/** Sıralama seçenekleri (REQ-ARA-008) — hiçbiri ticari sinyal içermez (AK-04). */
export const SearchSort = z.enum(['recommended', 'rating', 'reviews', 'nearest', 'newest']);
export type SearchSort = z.infer<typeof SearchSort>;

const slug = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const bool = z.enum(['true', 'false']).transform((v) => v === 'true');
/** Özellik filtresi: `anahtar:değer` (değer true/false ya da seçenek değeri). */
const attrFilter = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,59}:[a-zA-Z0-9_-]{1,60}$/);

/** Ortak filtreler (REQ-ARA-007). Bilinmeyen parametre 400 (REQ-MIM-009). */
export const SearchQuery = z.object({
  q: z.string().trim().max(200).optional(),
  province: slug.optional(),
  district: slug.optional(),
  category: slug.optional(),
  kind: ListingKind.optional(),
  type: z.enum(['LISTING', 'ARTICLE']).optional(),
  priceMax: z.coerce.number().int().min(1).max(4).optional(),
  minRating: z.enum(['3.5', '4', '4.5']).optional(),
  attr: z.union([attrFilter, z.array(attrFilter).max(10)]).optional(),
  sort: SearchSort.default('recommended'),
  lat: z.coerce.number().min(35).max(43).optional(),
  lng: z.coerce.number().min(25).max(45.5).optional(),
  /** false: sorgu ayrıştırıcı devre dışı (kullanıcı bir çipi kaldırdığında). */
  interpret: bool.default(true),
  page: z.coerce.number().int().min(1).max(50).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type SearchQuery = z.infer<typeof SearchQuery>;

export const SearchHit = z.object({
  type: z.enum(['LISTING', 'ARTICLE']),
  id: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  path: z.string(),
  kind: ListingKind.nullable(),
  articleType: ArticleType.nullable(),
  status: z.string().nullable(),
  priceLevel: z.number().int().nullable(),
  ratingCount: z.number().int(),
  distanceKm: z.number().nullable(),
  dataOrigin: z.string(),
});
export type SearchHit = z.infer<typeof SearchHit>;

/** Ayrıştırıcının uyguladığı filtreler — arayüzde kaldırılabilir çip olarak gösterilir (Ek A7.1). */
export const SearchInterpretation = z.object({
  place: z
    .object({
      name: z.string(),
      level: z.enum(['PROVINCE', 'DISTRICT']),
      province: z.string(),
      district: z.string().nullable(),
      corrected: z.boolean(),
    })
    .nullable(),
  category: z.object({ slug: z.string(), name: z.string() }).nullable(),
  intents: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      priceMax: z.number().int().nullable(),
      attrs: z.array(z.string()),
    }),
  ),
  /** Filtreye çevrilmeyen, tam metin aramaya giden kısım. */
  text: z.string().nullable(),
  didYouMean: z.string().nullable(),
});
export type SearchInterpretation = z.infer<typeof SearchInterpretation>;

/** Sıfır sonuçta tek filtre gevşetildiğinde kaç sonuç çıkacağı (REQ-ARA-013). */
export const SearchRelaxation = z.object({
  drop: z.string(),
  label: z.string(),
  count: z.number().int(),
});

export const SearchResponse = z
  .object({
    data: z.array(SearchHit),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
    sort: SearchSort,
    interpretation: SearchInterpretation,
    /** Tam metin sonuçları azsa benzerlik geri dönüşü kullanıldı (REQ-ARA-005). */
    fuzzyFallback: z.boolean(),
    relaxations: z.array(SearchRelaxation),
  })
  .meta({ id: 'SearchResponse' });
export type SearchResponse = z.infer<typeof SearchResponse>;

export const SuggestQuery = z.object({ q: z.string().trim().min(2).max(100) });

export const SuggestItem = z.object({
  title: z.string(),
  subtitle: z.string().nullable(),
  path: z.string(),
});
export const SuggestResponse = z
  .object({
    places: z.array(SuggestItem),
    categories: z.array(SuggestItem),
    listings: z.array(SuggestItem),
    articles: z.array(SuggestItem),
  })
  .meta({ id: 'SuggestResponse' });
export type SuggestResponse = z.infer<typeof SuggestResponse>;

/** Filtre paneli için filtrelenebilir özellikler (kategori şemasından `filterable`). */
export const SearchFilters = z
  .object({
    attributes: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        type: z.enum(['BOOL', 'ENUM', 'MULTI_ENUM', 'INT', 'DECIMAL']),
        options: z.array(z.object({ value: z.string(), label: z.string() })),
        /** Tanımlandığı kategoriler (alt kategoriler devralır). */
        categories: z.array(z.string()),
      }),
    ),
  })
  .meta({ id: 'SearchFilters' });
export type SearchFilters = z.infer<typeof SearchFilters>;
