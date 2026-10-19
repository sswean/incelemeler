import { z } from 'zod';
import { ListingContacts, ListingDetailsInput, ListingStatus } from './listings.js';
import { ListingKind } from './taxonomy.js';

/** Herkese açık listeleme (yalnızca yayında ya da kapalı durumda; DEMO üretimde hiç dönmez). */
export const PublicListing = z
  .object({
    id: z.string(),
    kind: ListingKind,
    slug: z.string(),
    name: z.string(),
    status: ListingStatus,
    shortDescription: z.string().nullable(),
    description: z.array(z.object({ type: z.literal('paragraph'), text: z.string() })).nullable(),
    category: z.object({ id: z.string(), name: z.string(), slug: z.string() }),
    /** Kökten birincil kategoriye zincir (kırıntı yolu ve tür eşlemesi için). */
    categoryPath: z.array(z.object({ name: z.string(), slug: z.string() })),
    /** Araç kiralama kategorisi (URL öneki /arac-kiralama) */
    carRental: z.boolean(),
    priceLevel: z.number().int().nullable(),
    contacts: ListingContacts,
    location: z
      .object({
        province: z.object({ name: z.string(), slug: z.string() }),
        district: z.object({ name: z.string(), slug: z.string() }).nullable(),
        neighborhood: z.string().nullable(),
        addressLine: z.string().nullable(),
        postalCode: z.string().nullable(),
        latitude: z.number().nullable(),
        longitude: z.number().nullable(),
      })
      .nullable(),
    /** Şemadaki etikete göre gösterim; bilinmeyen değerler hiç dönmez (REQ-LST-002). */
    attributes: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        type: z.string(),
        unit: z.string().nullable(),
        showOnCard: z.boolean(),
        value: z.unknown(),
        display: z.string(),
      }),
    ),
    details: ListingDetailsInput,
    /** Yalnızca lisansı tam ve süresi dolmamış görseller (Ek A14.6). */
    media: z.array(
      z.object({
        id: z.string(),
        role: z.enum(['PRIMARY', 'GALLERY']),
        width: z.number().int(),
        height: z.number().int(),
        altText: z.string(),
        blurhash: z.string().nullable(),
        focalX: z.number(),
        focalY: z.number(),
        credit: z.string(),
      }),
    ),
    /** Kullanıcı değerlendirmesi özeti (Ek A6.2) — Faz 1 dilim 7'ye kadar her zaman 0. */
    reviewCount: z.number().int(),
    dataOrigin: z.string(),
    sourceVerifiedAt: z.iso.datetime().nullable(),
    publishedAt: z.iso.datetime().nullable(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: 'PublicListing' });
export type PublicListing = z.infer<typeof PublicListing>;

/** Slug çözümü (REQ-VER-013, REQ-SEO-012): yönlendirme ve durum kodları için. */
export const SlugResolution = z
  .object({
    status: z.enum(['ok', 'moved', 'gone', 'missing']),
    kind: ListingKind.nullable(),
    slug: z.string().nullable(),
    carRental: z.boolean(),
  })
  .meta({ id: 'SlugResolution' });
export type SlugResolution = z.infer<typeof SlugResolution>;
export const SlugResolveQuery = z.object({ slug: z.string().min(1).max(200) });

export const SitemapEntry = z.object({
  kind: ListingKind,
  slug: z.string(),
  carRental: z.boolean(),
  lastmod: z.iso.datetime(),
});
export const SitemapPage = z
  .object({ data: z.array(SitemapEntry), nextCursor: z.string().nullable() })
  .meta({ id: 'SitemapPage' });
export type SitemapPage = z.infer<typeof SitemapPage>;
export const SitemapQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50_000).default(50_000),
});
