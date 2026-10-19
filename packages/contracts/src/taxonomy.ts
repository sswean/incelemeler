import { z } from 'zod';

/** Listeleme türleri — kodla tanımlı, küçük ve sabit (Ek A2.2, Ç-11). */
export const ListingKind = z.enum([
  'PLACE',
  'LODGING',
  'PRODUCT',
  'SERVICE_PROVIDER',
  'GUIDE_PERSON',
  'EXPERIENCE',
  'POI',
  'DESTINATION',
  'EVENT',
  'WORK',
]);
export type ListingKind = z.infer<typeof ListingKind>;

export const CategoryStatus = z.enum(['DRAFT', 'HIDDEN', 'PUBLISHED']);
export type CategoryStatus = z.infer<typeof CategoryStatus>;

/** Herkese açık kategori özeti. Yalnızca PUBLISHED kategoriler döner. */
export const CategorySummary = z
  .object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    parentId: z.string().nullable(),
    allowedKinds: z.array(ListingKind),
    sortOrder: z.number().int(),
  })
  .meta({ id: 'CategorySummary' });
export type CategorySummary = z.infer<typeof CategorySummary>;

export const PageInfo = z
  .object({ nextCursor: z.string().nullable(), hasMore: z.boolean() })
  .meta({ id: 'PageInfo' });

export const CategoryList = z
  .object({ data: z.array(CategorySummary), page: PageInfo })
  .meta({ id: 'CategoryList' });
export type CategoryList = z.infer<typeof CategoryList>;

export const CategoryListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});
export type CategoryListQuery = z.infer<typeof CategoryListQuery>;

// ── Yönetim (panel) ──

const CategoryFlags = {
  /** Sağlık/finans/hukuk gibi güven gereksinimi yüksek kategori (REQ-KAT-004). */
  ymyl: z.boolean(),
  requiresExpertReview: z.boolean(),
  ugcEnabled: z.boolean(),
  sponsorshipAllowed: z.boolean(),
  /** Lisans gerektiren kategori: turist rehberi, konaklama, seyahat acentesi … (REQ-KAT-004). */
  requiresLicense: z.boolean(),
};

export const AdminCategory = z
  .object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    parentId: z.string().nullable(),
    depth: z.number().int().min(1).max(3),
    allowedKinds: z.array(ListingKind),
    status: CategoryStatus,
    sortOrder: z.number().int(),
    ...CategoryFlags,
    dataOrigin: z.string(),
    firstPublishedAt: z.iso.datetime().nullable(),
    updatedAt: z.iso.datetime(),
    version: z.number().int(),
  })
  .meta({ id: 'AdminCategory' });
export type AdminCategory = z.infer<typeof AdminCategory>;

export const AdminCategoryList = z
  .object({ data: z.array(AdminCategory), page: PageInfo })
  .meta({ id: 'AdminCategoryList' });
export type AdminCategoryList = z.infer<typeof AdminCategoryList>;

export const AdminCategoryListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(500),
  cursor: z.string().optional(),
});
export type AdminCategoryListQuery = z.infer<typeof AdminCategoryListQuery>;

export const CategorySlug = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export const CategoryCreateBody = z
  .object({
    name: z.string().trim().min(2).max(80),
    slug: CategorySlug.optional(),
    parentId: z.uuid().nullable().optional(),
    allowedKinds: z.array(ListingKind).min(1).max(10),
    sortOrder: z.number().int().min(0).max(100_000).optional(),
    ymyl: z.boolean().optional(),
    requiresExpertReview: z.boolean().optional(),
    ugcEnabled: z.boolean().optional(),
    sponsorshipAllowed: z.boolean().optional(),
    requiresLicense: z.boolean().optional(),
  })
  .strict()
  .meta({ id: 'CategoryCreateBody' });
export type CategoryCreateBody = z.infer<typeof CategoryCreateBody>;

export const CategoryUpdateBody = z
  .object({
    /** İyimser kilit: okunan sürüm; uyuşmazsa 412 (REQ-MIM-011). */
    version: z.number().int().min(1),
    name: z.string().trim().min(2).max(80).optional(),
    slug: CategorySlug.optional(),
    allowedKinds: z.array(ListingKind).min(1).max(10).optional(),
    status: CategoryStatus.optional(),
    sortOrder: z.number().int().min(0).max(100_000).optional(),
    ymyl: z.boolean().optional(),
    requiresExpertReview: z.boolean().optional(),
    ugcEnabled: z.boolean().optional(),
    sponsorshipAllowed: z.boolean().optional(),
    requiresLicense: z.boolean().optional(),
  })
  .strict()
  .meta({ id: 'CategoryUpdateBody' });
export type CategoryUpdateBody = z.infer<typeof CategoryUpdateBody>;
