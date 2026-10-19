import { z } from 'zod';
import { ListingKind } from './taxonomy.js';

/** İçe aktarma sınırları (REQ-LST-007). */
export const IMPORT_LIMITS = {
  maxBytes: 2_000_000,
  maxRows: 2000,
  duplicateRadiusMeters: 150,
} as const;

/** Eşlenebilir alanlar; kategori özellikleri `attr.<anahtar>` biçimindedir. */
export const IMPORT_FIELDS = [
  'name',
  'shortDescription',
  'province',
  'district',
  'neighborhood',
  'addressLine',
  'postalCode',
  'latitude',
  'longitude',
  'phone',
  'website',
  'email',
  'reservationUrl',
  'priceLevel',
  'brand',
  'model',
  'gtin',
  'tourismLicenseNo',
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

export const ImportPreviewBody = z
  .object({
    kind: ListingKind,
    primaryCategoryId: z.uuid(),
    /** Verinin kaynağı (ZORUNLU): lisanslı veri, işletme beyanı, editör derlemesi… */
    source: z.string().trim().min(2).max(200),
    fileName: z.string().trim().max(200).optional(),
    csv: z.string().min(1).max(IMPORT_LIMITS.maxBytes),
    /** Başlık → alan (ör. { "Firma": "name" }); verilmeyen başlıklar adlarından eşlenir. */
    mapping: z.record(z.string(), z.string()).optional(),
  })
  .strict()
  .meta({ id: 'ImportPreviewBody' });
export type ImportPreviewBody = z.infer<typeof ImportPreviewBody>;

export const ImportRowReport = z.object({
  row: z.number().int(),
  status: z.enum(['VALID', 'INVALID', 'DUPLICATE', 'CREATED', 'SKIPPED']),
  name: z.string().nullable(),
  errors: z.array(z.object({ field: z.string(), code: z.string() })),
  duplicateOf: z
    .object({
      listingId: z.string().nullable(),
      row: z.number().int().nullable(),
      reason: z.enum(['gtin', 'name_proximity', 'name_district']),
    })
    .nullable(),
  listingId: z.string().nullable(),
});
export type ImportRowReport = z.infer<typeof ImportRowReport>;

export const ImportBatch = z
  .object({
    id: z.string(),
    kind: ListingKind,
    primaryCategory: z.object({ id: z.string(), name: z.string() }),
    source: z.string(),
    fileName: z.string().nullable(),
    status: z.enum(['PREVIEW', 'COMMITTED', 'ROLLED_BACK']),
    mapping: z.record(z.string(), z.string()),
    unmappedHeaders: z.array(z.string()),
    rowCount: z.number().int(),
    validCount: z.number().int(),
    createdCount: z.number().int(),
    createdAt: z.iso.datetime(),
    committedAt: z.iso.datetime().nullable(),
    rolledBackAt: z.iso.datetime().nullable(),
    rows: z.array(ImportRowReport),
  })
  .meta({ id: 'ImportBatch' });
export type ImportBatch = z.infer<typeof ImportBatch>;

export const ImportBatchList = z
  .object({ data: z.array(ImportBatch.omit({ rows: true })) })
  .meta({ id: 'ImportBatchList' });
