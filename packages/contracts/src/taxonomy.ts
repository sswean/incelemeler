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
