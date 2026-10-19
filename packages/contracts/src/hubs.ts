import { z } from 'zod';
import { ArticleType } from './content.js';
import { SearchHit, SponsoredItem } from './search.js';

/**
 * Yayın eşikleri (§7.2; panelden ayarlanır). Eşiğin altındaki hub sayfası üretilmez; menü, site haritası ve
 * otomatik tamamlama dışındadır (REQ-KAT-003). Varsayılanlar ana metindeki tablodan.
 */
export const PublicationThresholds = z
  .object({
    /** İl × kategori: yayımlanmış listeleme sayısı. */
    provinceCategoryListings: z.number().int().min(0).max(10_000),
    /** İl × kategori: hub listelemelerine bağlı yayımlanmış editoryal içerik sayısı. */
    provinceCategoryArticles: z.number().int().min(0).max(1_000),
    /** İlçe × kategori: yayımlanmış listeleme sayısı. */
    districtCategoryListings: z.number().int().min(0).max(10_000),
    /** İlçe sayfası: yayımlanmış listeleme sayısı. */
    districtListings: z.number().int().min(0).max(10_000),
    /** Destinasyon (il) sayfası: ilin listelemelerine bağlı yayımlanmış rehber sayısı. */
    provinceGuides: z.number().int().min(0).max(1_000),
    /** Destinasyon (il) sayfası: eşiği sağlayan il × kategori hub'ı sayısı. */
    provinceHubs: z.number().int().min(0).max(1_000),
  })
  .meta({ id: 'PublicationThresholds' });
export type PublicationThresholds = z.infer<typeof PublicationThresholds>;

export const DEFAULT_THRESHOLDS: PublicationThresholds = {
  provinceCategoryListings: 30,
  provinceCategoryArticles: 1,
  districtCategoryListings: 10,
  districtListings: 10,
  provinceGuides: 1,
  provinceHubs: 2,
};

export const ThresholdsUpdateBody = PublicationThresholds.extend({
  /** İyimser kilit (REQ-MIM-011). */
  version: z.number().int().min(0),
});
export const ThresholdsResponse = PublicationThresholds.extend({
  version: z.number().int(),
}).meta({ id: 'ThresholdsResponse' });

const slug = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export const HubQuery = z.object({
  province: slug,
  /** İkinci yol bölümü: ilçe ya da kategori (aynı il altında çakışamaz). */
  segment: slug.optional(),
  /** Üçüncü yol bölümü: ilçe sayfasında kategori. */
  category: slug.optional(),
  page: z.coerce.number().int().min(1).max(50).default(1),
});
export type HubQuery = z.infer<typeof HubQuery>;

export const HubLink = z.object({ path: z.string(), label: z.string(), count: z.number().int() });

export const Hub = z
  .object({
    kind: z.enum(['PROVINCE', 'DISTRICT', 'PROVINCE_CATEGORY', 'DISTRICT_CATEGORY']),
    path: z.string(),
    province: z.object({ slug: z.string(), name: z.string() }),
    district: z.object({ slug: z.string(), name: z.string() }).nullable(),
    category: z.object({ slug: z.string(), name: z.string() }).nullable(),
    listingCount: z.number().int(),
    /** Organik sıralı listelemeler (ticari sinyal yok; sponsorlu yerleşim ayrı ve etiketli — D9). */
    listings: z.array(SearchHit),
    /** Sponsorlu yerleşimler ayrı dizi; hub'ın il/ilçe/kategori bağlamıyla eşleşir (REQ-SPN-002/004). */
    sponsored: z.array(SponsoredItem),
    page: z.number().int(),
    pageSize: z.number().int(),
    articles: z.array(
      z.object({
        type: ArticleType,
        slug: z.string(),
        title: z.string(),
        summary: z.string().nullable(),
      }),
    ),
    /** Eşiği sağlayan alt hub'lar (iç bağlantı — REQ-SEO-011). */
    children: z.array(HubLink),
    /** Üst hub'lar eşiği sağlıyorsa bağlantı verilir (kırıntı). */
    parents: z.array(HubLink),
    /** Gösterilen listelemelerin tamamı demo ise arama motorlarına kapalı (AK-03). */
    demoOnly: z.boolean(),
    lastmod: z.iso.datetime().nullable(),
  })
  .meta({ id: 'Hub' });
export type Hub = z.infer<typeof Hub>;

export const HubSitemap = z
  .object({ data: z.array(z.object({ path: z.string(), lastmod: z.iso.datetime() })) })
  .meta({ id: 'HubSitemap' });
