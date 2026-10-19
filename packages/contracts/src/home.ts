import { z } from 'zod';
import { CardCommercial } from './search.js';

export const HomeModuleType = z.enum([
  'CATEGORY_SHORTCUTS',
  'CITY_PICKER',
  'EDITORS_PICKS',
  'CATEGORY_POPULAR',
  'SEASONAL',
  'NEW_ARTICLES',
  'COMPARISONS',
  'SPONSORED',
  'TRUST_LINKS',
]);
export type HomeModuleType = z.infer<typeof HomeModuleType>;

/** Ana sayfa kartı: her kartta ticari alan zorunlu (REQ-SPN-003). */
export const HomeCard = z.object({
  kind: z.enum(['LISTING', 'ARTICLE', 'CATEGORY', 'PLACE', 'LINK']),
  id: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  path: z.string(),
  commercial: CardCommercial,
  sponsored: z
    .object({ placementId: z.string(), clickHref: z.string(), impressionToken: z.string() })
    .nullable(),
});
export type HomeCard = z.infer<typeof HomeCard>;

export const HomeQuery = z.object({
  il: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .optional(),
});
export const HomeResponse = z
  .object({
    province: z.object({ slug: z.string(), name: z.string() }).nullable(),
    modules: z.array(
      z.object({
        key: z.string(),
        type: HomeModuleType,
        title: z.string(),
        cards: z.array(HomeCard),
      }),
    ),
  })
  .meta({ id: 'HomeResponse' });
export type HomeResponse = z.infer<typeof HomeResponse>;

const slug = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
export const HomeModuleConfig = z.object({
  categorySlug: slug.optional(),
  provinceSlug: slug.optional(),
  listingSlugs: z.array(slug).max(24).optional(),
  articleSlugs: z.array(slug).max(24).optional(),
});
export const AdminHomeModule = z
  .object({
    id: z.string(),
    key: z.string(),
    type: HomeModuleType,
    title: z.string(),
    source: z.enum(['EDITORIAL', 'RULE', 'SPONSORED']),
    position: z.number().int(),
    enabled: z.boolean(),
    minItems: z.number().int(),
    maxItems: z.number().int(),
    config: HomeModuleConfig,
    visibleFrom: z.iso.datetime().nullable(),
    visibleUntil: z.iso.datetime().nullable(),
    provinceSlug: z.string().nullable(),
    version: z.number().int(),
  })
  .meta({ id: 'AdminHomeModule' });
export type AdminHomeModule = z.infer<typeof AdminHomeModule>;
export const AdminHomeModuleList = z
  .object({ data: z.array(AdminHomeModule) })
  .meta({ id: 'AdminHomeModuleList' });
export const HomeModuleUpdateBody = z.object({
  title: z.string().trim().min(2).max(80).optional(),
  enabled: z.boolean().optional(),
  position: z.number().int().min(0).max(1000).optional(),
  minItems: z.number().int().min(0).max(24).optional(),
  maxItems: z.number().int().min(1).max(24).optional(),
  config: HomeModuleConfig.optional(),
  visibleFrom: z.iso.datetime().nullable().optional(),
  visibleUntil: z.iso.datetime().nullable().optional(),
  provinceSlug: slug.nullable().optional(),
  version: z.number().int().positive(),
});

/** Sponsorlu ana sayfa üst sınırları (A8.3): en çok 2 modül, modül başına en çok 2 kart, ilk 3 modülde değil. */
export const HOME_SPONSORED = { maxModules: 2, maxCards: 2, firstAllowedIndex: 3, cardShare: 0.2 };

/**
 * Ana sayfa yapılandırma kuralı (REQ-ADM-006, REQ-SPN-004): sponsorlu sınırları aşan yapılandırma kaydedilmez.
 * `modules` etkin modüllerin sıraya dizilmiş listesidir.
 */
export function homeRuleErrors(
  modules: ReadonlyArray<{
    type: HomeModuleType;
    enabled: boolean;
    position: number;
    maxItems: number;
  }>,
): string[] {
  const enabled = modules.filter((m) => m.enabled).sort((a, b) => a.position - b.position);
  const errors = new Set<string>();
  const sponsored = enabled.filter((m) => m.type === 'SPONSORED');
  if (sponsored.length > HOME_SPONSORED.maxModules) errors.add('home_sponsored_modules');
  if (sponsored.some((m) => m.maxItems > HOME_SPONSORED.maxCards))
    errors.add('home_sponsored_cards');
  // Arama kutusunun üstünde ve ilk ekranda (ilk 3 modül) sponsorlu modül yok.
  if (enabled.findIndex((m) => m.type === 'SPONSORED') > -1) {
    const first = enabled.findIndex((m) => m.type === 'SPONSORED');
    if (first < HOME_SPONSORED.firstAllowedIndex) errors.add('home_sponsored_position');
  }
  return [...errors];
}
