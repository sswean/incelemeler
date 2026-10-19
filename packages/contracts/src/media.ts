import { z } from 'zod';

export const MediaSourceType = z.enum(['EDITOR', 'OWNER', 'USER', 'STOCK']);
export type MediaSourceType = z.infer<typeof MediaSourceType>;

/** Desteklenen yükleme türleri (sihirli baytlarla doğrulanır) ve sınırlar (REQ-GUV-008, Ek A6.4). */
export const MEDIA_LIMITS = {
  maxBytes: 10 * 1024 * 1024,
  maxDimension: 12_000,
  maxPixels: 50_000_000,
  types: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

export const MediaAsset = z
  .object({
    id: z.string(),
    mime: z.string(),
    bytes: z.number().int(),
    width: z.number().int(),
    height: z.number().int(),
    focalX: z.number(),
    focalY: z.number(),
    blurhash: z.string().nullable(),
    altText: z.string().nullable(),
    status: z.enum(['READY', 'REJECTED']),
    exifStripped: z.boolean(),
    sourceType: MediaSourceType.nullable(),
    rightsHolder: z.string().nullable(),
    licenseType: z.string().nullable(),
    permissionRef: z.string().nullable(),
    licenseExpiresAt: z.iso.datetime().nullable(),
    modelPropertyRelease: z.boolean().nullable(),
    /** Ek A14.6 lisans alanları tam ve süresi dolmamış mı? Değilse görsel yayımlanamaz. */
    licenseComplete: z.boolean(),
    dataOrigin: z.string(),
    createdAt: z.iso.datetime(),
    version: z.number().int(),
  })
  .meta({ id: 'MediaAsset' });
export type MediaAsset = z.infer<typeof MediaAsset>;

/** Yükleme formu (multipart/form-data) — yalnızca OpenAPI belgesi için. */
export const MediaUploadForm = z.object({
  file: z.file(),
  altText: z.string().max(300).optional(),
});

export const MediaUpdateBody = z
  .object({
    version: z.number().int().min(1),
    altText: z.string().trim().min(1).max(300).nullable().optional(),
    focalX: z.number().min(0).max(1).optional(),
    focalY: z.number().min(0).max(1).optional(),
    sourceType: MediaSourceType.nullable().optional(),
    rightsHolder: z.string().trim().min(2).max(200).nullable().optional(),
    licenseType: z.string().trim().min(2).max(100).nullable().optional(),
    /** İzin belgesi: belge numarası/konumu ya da URL. */
    permissionRef: z.string().trim().min(2).max(500).nullable().optional(),
    licenseExpiresAt: z.iso.datetime().nullable().optional(),
    modelPropertyRelease: z.boolean().nullable().optional(),
  })
  .strict()
  .meta({ id: 'MediaUpdateBody' });
export type MediaUpdateBody = z.infer<typeof MediaUpdateBody>;

type LicenseFields = Pick<
  MediaAsset,
  'sourceType' | 'rightsHolder' | 'licenseType' | 'permissionRef' | 'licenseExpiresAt'
>;

/**
 * Ek A14.6: kaynak türü, hak sahibi ve lisans türü zorunlu; işletme ve stok görsellerinde yazılı izin
 * belgesi zorunlu; süresi dolmuş lisans geçersiz (A-012).
 */
export function isLicenseComplete(m: LicenseFields, now = new Date()): boolean {
  if (!m.sourceType || !m.rightsHolder || !m.licenseType) return false;
  if ((m.sourceType === 'OWNER' || m.sourceType === 'STOCK') && !m.permissionRef) return false;
  if (m.licenseExpiresAt && new Date(m.licenseExpiresAt) <= now) return false;
  return true;
}

export const ListingMediaItem = z
  .object({ mediaId: z.uuid(), role: z.enum(['PRIMARY', 'GALLERY']) })
  .strict();
export type ListingMediaItem = z.infer<typeof ListingMediaItem>;
