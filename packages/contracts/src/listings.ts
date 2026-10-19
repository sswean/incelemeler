import { z } from 'zod';
import { ListingMediaItem } from './media.js';
import { ListingKind, PageInfo } from './taxonomy.js';

export const ListingStatus = z.enum([
  'DRAFT',
  'IN_REVIEW',
  'PUBLISHED',
  'CLOSED_TEMPORARILY',
  'CLOSED_PERMANENTLY',
  'ARCHIVED',
]);
export type ListingStatus = z.infer<typeof ListingStatus>;

/** Panelden oluşturulabilen köken: editör girişi ya da (yalnızca üretim dışı) kurgusal demo. */
export const AdminListingOrigin = z.enum(['EDITORIAL', 'DEMO']);

export const AdminArea = z
  .object({
    id: z.string(),
    level: z.enum(['PROVINCE', 'DISTRICT']),
    name: z.string(),
    slug: z.string(),
    code: z.string().nullable(),
    parentId: z.string().nullable(),
  })
  .meta({ id: 'AdminArea' });
export type AdminArea = z.infer<typeof AdminArea>;
export const AdminAreaList = z.object({ data: z.array(AdminArea) }).meta({ id: 'AdminAreaList' });
export const AdminAreaListQuery = z.object({
  level: z.enum(['PROVINCE', 'DISTRICT']).optional(),
  parentId: z.uuid().optional(),
});

const httpsUrl = z.url({ protocol: /^https?$/ }).max(500);

export const ListingContacts = z
  .object({
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{7,20}$/)
      .optional(),
    website: httpsUrl.optional(),
    email: z.email().max(254).optional(),
    reservationUrl: httpsUrl.optional(),
  })
  .strict()
  .meta({ id: 'ListingContacts' });
export type ListingContacts = z.infer<typeof ListingContacts>;

/** "Hakkında" bölümü (REQ-LST-010). Zengin blok tipleri içerik editörü dilimiyle (D5) genişler. */
export const DescriptionBlocks = z
  .array(z.object({ type: z.literal('paragraph'), text: z.string().trim().min(1).max(5000) }))
  .max(50);

const coordinate = (min: number, max: number) =>
  z
    .number()
    .min(min)
    .max(max)
    .transform((v) => Math.round(v * 1e6) / 1e6);

export const ListingLocationInput = z
  .object({
    provinceId: z.uuid(),
    districtId: z.uuid().nullable().optional(),
    neighborhood: z.string().trim().max(120).nullable().optional(),
    addressLine: z.string().trim().max(300).nullable().optional(),
    postalCode: z
      .string()
      .regex(/^\d{5}$/)
      .nullable()
      .optional(),
    latitude: coordinate(-90, 90).nullable().optional(),
    longitude: coordinate(-180, 180).nullable().optional(),
  })
  .strict()
  .refine((l) => (l.latitude == null) === (l.longitude == null), {
    message: 'Enlem ve boylam birlikte verilmeli',
    path: ['latitude'],
  })
  .meta({ id: 'ListingLocationInput' });

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const ListingDetailsInput = z
  .object({
    lodging: z
      .object({
        tourismLicenseNo: z.string().trim().min(1).max(40).nullable().optional(),
        licenseVerifiedAt: z.iso.datetime().nullable().optional(),
        checkInTime: time.nullable().optional(),
        checkOutTime: time.nullable().optional(),
      })
      .strict()
      .optional(),
    product: z
      .object({
        brand: z.string().trim().min(1).max(80),
        model: z.string().trim().min(1).max(120),
        gtin: z
          .string()
          .regex(/^\d{8,14}$/)
          .nullable()
          .optional(),
        releaseDate: z.iso.date().nullable().optional(),
      })
      .strict()
      .optional(),
    experience: z
      .object({
        durationMinutes: z
          .number()
          .int()
          .min(1)
          .max(60 * 24 * 30)
          .nullable()
          .optional(),
        startPoint: z.string().trim().max(200).nullable().optional(),
      })
      .strict()
      .optional(),
    event: z
      .object({
        startsAt: z.iso.datetime().nullable().optional(),
        endsAt: z.iso.datetime().nullable().optional(),
        venueListingId: z.uuid().nullable().optional(),
      })
      .strict()
      .optional(),
    guide: z
      .object({
        languages: z
          .array(z.string().regex(/^[a-z]{2}$/))
          .max(20)
          .optional(),
        licenseVerifiedAt: z.iso.datetime().nullable().optional(),
        consentAt: z.iso.datetime().nullable().optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .meta({ id: 'ListingDetailsInput' });
export type ListingDetailsInput = z.infer<typeof ListingDetailsInput>;

const editable = {
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  shortDescription: z.string().trim().max(300).nullable(),
  description: DescriptionBlocks.nullable(),
  primaryCategoryId: z.uuid(),
  secondaryCategoryIds: z.array(z.uuid()).max(3),
  organizationId: z.uuid().nullable(),
  priceLevel: z.number().int().min(1).max(4).nullable(),
  attributes: z.record(z.string(), z.unknown()),
  contacts: ListingContacts,
  location: ListingLocationInput.nullable(),
  serviceAreaProvinceIds: z.array(z.uuid()).max(81),
  details: ListingDetailsInput,
  /** Görseller: en fazla 30, en fazla bir kapak (PRIMARY). */
  media: z.array(ListingMediaItem).max(30),
  /** Bilginin kaynağı (§12.4): editör girişi, işletme beyanı, lisanslı veri… */
  source: z.string().trim().min(2).max(200),
  sourceVerifiedAt: z.iso.datetime().nullable(),
};

export const ListingCreateBody = z
  .object({
    kind: ListingKind,
    dataOrigin: AdminListingOrigin.default('EDITORIAL'),
    ...editable,
  })
  .partial({
    slug: true,
    shortDescription: true,
    description: true,
    secondaryCategoryIds: true,
    organizationId: true,
    priceLevel: true,
    attributes: true,
    contacts: true,
    location: true,
    serviceAreaProvinceIds: true,
    details: true,
    media: true,
    sourceVerifiedAt: true,
  })
  .strict()
  .meta({ id: 'ListingCreateBody' });
export type ListingCreateBody = z.infer<typeof ListingCreateBody>;

/** Tür ve köken değişmez. İyimser kilit: `version` (REQ-MIM-011). */
export const ListingUpdateBody = z
  .object({ version: z.number().int().min(1), ...editable })
  .partial()
  .required({ version: true })
  .strict()
  .meta({ id: 'ListingUpdateBody' });
export type ListingUpdateBody = z.infer<typeof ListingUpdateBody>;

export const ListingStatusBody = z
  .object({ version: z.number().int().min(1), status: ListingStatus })
  .strict()
  .meta({ id: 'ListingStatusBody' });
export type ListingStatusBody = z.infer<typeof ListingStatusBody>;

const Issue = z.object({ pointer: z.string(), code: z.string() });

export const AdminListing = z
  .object({
    id: z.string(),
    kind: ListingKind,
    slug: z.string(),
    name: z.string(),
    shortDescription: z.string().nullable(),
    description: DescriptionBlocks.nullable(),
    primaryCategory: z.object({ id: z.string(), name: z.string(), slug: z.string() }),
    secondaryCategoryIds: z.array(z.string()),
    organizationId: z.string().nullable(),
    status: ListingStatus,
    priceLevel: z.number().int().nullable(),
    attributes: z.record(z.string(), z.unknown()),
    attributeSchemaVersion: z.number().int(),
    contacts: ListingContacts,
    location: z
      .object({
        provinceId: z.string(),
        provinceName: z.string(),
        districtId: z.string().nullable(),
        districtName: z.string().nullable(),
        neighborhood: z.string().nullable(),
        addressLine: z.string().nullable(),
        postalCode: z.string().nullable(),
        latitude: z.number().nullable(),
        longitude: z.number().nullable(),
      })
      .nullable(),
    serviceAreaProvinceIds: z.array(z.string()),
    details: ListingDetailsInput,
    media: z.array(
      z.object({
        mediaId: z.string(),
        role: z.enum(['PRIMARY', 'GALLERY']),
        width: z.number().int(),
        height: z.number().int(),
        blurhash: z.string().nullable(),
        altText: z.string().nullable(),
        licenseComplete: z.boolean(),
      }),
    ),
    dataOrigin: z.string(),
    source: z.string(),
    sourceVerifiedAt: z.iso.datetime().nullable(),
    publishedAt: z.iso.datetime().nullable(),
    updatedAt: z.iso.datetime(),
    version: z.number().int(),
    /** Yayın için eksikler (REQ-LST-001); boşsa yayımlanabilir. */
    publishBlockers: z.array(Issue),
  })
  .meta({ id: 'AdminListing' });
export type AdminListing = z.infer<typeof AdminListing>;

export const AdminListingSummary = z
  .object({
    id: z.string(),
    kind: ListingKind,
    slug: z.string(),
    name: z.string(),
    status: ListingStatus,
    primaryCategoryName: z.string(),
    provinceName: z.string().nullable(),
    dataOrigin: z.string(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: 'AdminListingSummary' });

export const AdminListingList = z
  .object({ data: z.array(AdminListingSummary), page: PageInfo })
  .meta({ id: 'AdminListingList' });
export type AdminListingList = z.infer<typeof AdminListingList>;

export const AdminListingListQuery = z.object({
  kind: ListingKind.optional(),
  status: ListingStatus.optional(),
  categoryId: z.uuid().optional(),
  q: z.string().trim().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});
export type AdminListingListQuery = z.infer<typeof AdminListingListQuery>;
