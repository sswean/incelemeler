import { z } from 'zod';
import { ListingKind } from './taxonomy.js';

/**
 * Hesapsız başvurular (REQ-ISL-001/002): işletme ekleme ve reklam/sponsorluk talebi. Başvuru e-postayla
 * doğrulanır, ardından yönetici kuyruğuna düşer. Belge yükleme kötü amaçlı içerik taraması (X-010) olmadan
 * anonim kullanıcıya açılmaz (REQ-GUV-008, A-028).
 */
export const ApplicationType = z.enum(['BUSINESS', 'ADVERTISING']);
export type ApplicationType = z.infer<typeof ApplicationType>;
export const ApplicationStatus = z.enum(['UNVERIFIED', 'PENDING', 'APPROVED', 'REJECTED']);
export type ApplicationStatus = z.infer<typeof ApplicationStatus>;

/** Ticari ürünler (Ek A8.1; kapsam dışı display reklam ve Faz 3 teklif talebi hariç). */
export const AdProduct = z.enum([
  'SPONSORED_CONTENT',
  'SPONSORED_FEATURE',
  'SPONSORED_PLACEMENT',
  'SPONSORED_BRAND_PAGE',
  'SEASONAL_DEAL',
  'AFFILIATE',
]);
export type AdProduct = z.infer<typeof AdProduct>;
export const BudgetRange = z.enum([
  'UNDER_10K',
  'FROM_10K_TO_50K',
  'FROM_50K_TO_250K',
  'OVER_250K',
]);
export type BudgetRange = z.infer<typeof BudgetRange>;

/**
 * Başvuruyla eklenebilen işletme türleri. Konaklama hukuki kapı açılana dek (REQ-KAT-004) ve işletme olmayan
 * türler (ürün, ilgi noktası, destinasyon, etkinlik, eser) dışarıda (A-028).
 */
export const ApplicationBusinessKind = ListingKind.extract([
  'PLACE',
  'SERVICE_PROVIDER',
  'GUIDE_PERSON',
  'EXPERIENCE',
]);
export type ApplicationBusinessKind = z.infer<typeof ApplicationBusinessKind>;

export const ApplicationRejection = z.enum([
  'INCOMPLETE',
  'DUPLICATE',
  'NOT_ELIGIBLE',
  'UNVERIFIABLE',
  'OUT_OF_SCOPE',
]);
export type ApplicationRejection = z.infer<typeof ApplicationRejection>;

const Email = z
  .string()
  .trim()
  .max(254)
  .email()
  .transform((v) => v.toLowerCase());
const Phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{7,20}$/);
const Text = (min: number, max: number) => z.string().trim().min(min).max(max);

export const BusinessApplicationBody = z
  .object({
    type: z.literal('BUSINESS'),
    businessName: Text(2, 120),
    kind: ApplicationBusinessKind,
    categoryId: z.uuid(),
    provinceId: z.uuid(),
    districtId: z.uuid().optional(),
    /** Adres ya da hizmet bölgesi (en az biri). */
    address: Text(5, 300).optional(),
    serviceArea: Text(3, 300).optional(),
    phone: Phone.optional(),
    website: z
      .url({ protocol: /^https?$/ })
      .max(300)
      .optional(),
    contactName: Text(2, 100),
    contactRole: Text(2, 100),
    email: Email,
    /** KVKK aydınlatma metni okundu (açık rıza değil — REQ-KVK-001). */
    privacyNoticeAck: z.literal(true),
    /** Bilgilerin doğruluğu ve işletme adına başvurma yetkisi beyanı. */
    authorityAck: z.literal(true),
  })
  .strict()
  .refine((b) => b.address || b.serviceArea, {
    path: ['address'],
    message: 'Adres ya da hizmet bölgesi gerekli',
  })
  .meta({ id: 'BusinessApplicationBody' });

export const AdvertisingApplicationBody = z
  .object({
    type: z.literal('ADVERTISING'),
    organizationName: Text(2, 120),
    contactName: Text(2, 100),
    contactRole: Text(2, 100).optional(),
    email: Email,
    phone: Phone.optional(),
    products: z.array(AdProduct).min(1).max(AdProduct.options.length),
    provinceIds: z.array(z.uuid()).max(10).default([]),
    categoryIds: z.array(z.uuid()).max(10).default([]),
    budgetRange: BudgetRange.optional(),
    message: Text(10, 2000),
    privacyNoticeAck: z.literal(true),
    /** Ticari elektronik ileti izni: ayrı, isteğe bağlı, varsayılan kapalı (REQ-ISL-002). */
    marketingConsent: z.boolean().default(false),
  })
  .strict()
  .meta({ id: 'AdvertisingApplicationBody' });

export const ApplicationCreateBody = z
  .discriminatedUnion('type', [BusinessApplicationBody, AdvertisingApplicationBody])
  .meta({ id: 'ApplicationCreateBody' });
export type ApplicationCreateBody = z.infer<typeof ApplicationCreateBody>;

export const ApplicationAck = z
  .object({ accepted: z.literal(true), verificationRequired: z.literal(true) })
  .meta({ id: 'ApplicationAck' });

const Named = z.object({ id: z.string(), name: z.string() });

export const AdminApplication = z
  .object({
    id: z.string(),
    type: ApplicationType,
    status: ApplicationStatus,
    name: z.string(),
    contactName: z.string(),
    contactRole: z.string().nullable(),
    email: z.string(),
    /** Ücretsiz e-posta sağlayıcısı (kurumsal adres değil) — inceleme sinyali, ret gerekçesi değil. */
    freeEmailDomain: z.boolean(),
    phone: z.string().nullable(),
    business: z
      .object({
        kind: ApplicationBusinessKind,
        category: Named.nullable(),
        province: Named.nullable(),
        district: Named.nullable(),
        address: z.string().nullable(),
        serviceArea: z.string().nullable(),
        website: z.string().nullable(),
      })
      .nullable(),
    advertising: z
      .object({
        products: z.array(AdProduct),
        provinces: z.array(Named),
        categories: z.array(Named),
        budgetRange: BudgetRange.nullable(),
        message: z.string(),
        marketingConsent: z.boolean(),
      })
      .nullable(),
    emailVerifiedAt: z.iso.datetime().nullable(),
    decidedAt: z.iso.datetime().nullable(),
    rejectionReason: ApplicationRejection.nullable(),
    decisionNote: z.string().nullable(),
    listingId: z.string().nullable(),
    createdAt: z.iso.datetime(),
    version: z.number().int(),
  })
  .meta({ id: 'AdminApplication' });
export type AdminApplication = z.infer<typeof AdminApplication>;

export const AdminApplicationList = z
  .object({ data: z.array(AdminApplication) })
  .meta({ id: 'AdminApplicationList' });

export const AdminApplicationQuery = z
  .object({
    type: ApplicationType.optional(),
    status: ApplicationStatus.default('PENDING'),
  })
  .strict();

export const ApplicationDecisionBody = z
  .object({
    version: z.number().int().min(1),
    decision: z.enum(['APPROVE', 'REJECT']),
    reason: ApplicationRejection.optional(),
    note: Text(3, 1000).optional(),
  })
  .strict()
  .refine((b) => b.decision === 'APPROVE' || b.reason, {
    path: ['reason'],
    message: 'Ret gerekçesi gerekli',
  })
  .meta({ id: 'ApplicationDecisionBody' });
export type ApplicationDecisionBody = z.infer<typeof ApplicationDecisionBody>;

/** Kurumsal olmayan yaygın e-posta sağlayıcıları (inceleme sinyali). */
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'hotmail.com.tr',
  'outlook.com',
  'outlook.com.tr',
  'live.com',
  'yahoo.com',
  'yandex.com',
  'yandex.com.tr',
  'icloud.com',
  'mail.ru',
  'proton.me',
  'protonmail.com',
]);
export function isFreeEmailDomain(email: string): boolean {
  return FREE_EMAIL_DOMAINS.has(email.slice(email.lastIndexOf('@') + 1));
}
