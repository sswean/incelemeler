import { z } from 'zod';
import { CommercialRelation } from './content.js';

/** Dış bağlantı türleri (REQ-AFF-001). Ticari türler (affiliate/rezervasyon/satın alma) sağlayıcıya bağlıdır. */
export const OutboundKind = z.enum([
  'AFFILIATE',
  'BOOKING',
  'PURCHASE',
  'WEBSITE',
  'PHONE',
  'MESSAGING',
  'MAP',
  'QUOTE_REQUEST',
]);
export type OutboundKind = z.infer<typeof OutboundKind>;
export const OutboundStatus = z.enum(['ACTIVE', 'DISABLED', 'BROKEN', 'EXPIRED']);
export const IntegrationStatus = z.enum(['LINK_ONLY', 'SANDBOX', 'LIVE', 'DISABLED']);

const CtaTypeSchema = z.enum([
  'WEBSITE',
  'OFFICIAL_SITE',
  'RESERVATION',
  'PROVIDER_PRICES',
  'PROVIDER_DATES',
  'SELLER',
  'TICKETS',
  'APPOINTMENT',
  'CAR_RENTAL',
  'BUY',
  'WATCH',
]);

/** Sayfada gösterilen dış eylem: hedef URL değil, yalnızca `/git/{id}?ctx=…` yolu (REQ-AFF-002). */
export const PublicOutbound = z.object({
  id: z.string(),
  kind: OutboundKind,
  ctaType: CtaTypeSchema,
  label: z.string().nullable(),
  commercialRelation: CommercialRelation,
  providerName: z.string().nullable(),
  href: z.string(),
});
export type PublicOutbound = z.infer<typeof PublicOutbound>;

export const OutboundResolveQuery = z.object({ ctx: z.string().max(2000).optional() });
export const OutboundResolve = z.object({ url: z.string() }).meta({ id: 'OutboundResolve' });

const domain = z
  .string()
  .trim()
  .min(3)
  .max(253)
  .regex(/^[\p{L}\p{N}.-]+$/u);
const httpsUrl = z.url({ protocol: /^https$/ }).max(500);

export const ProviderBody = z.object({
  key: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().trim().min(2).max(120),
  integrationStatus: IntegrationStatus.default('LINK_ONLY'),
  docsUrl: httpsUrl.nullable().optional(),
  termsUrl: httpsUrl.nullable().optional(),
  termsVerifiedAt: z.iso.datetime().nullable().optional(),
  allowedDomains: z.array(domain).min(1).max(20),
  credentialEnvNames: z
    .array(z.string().regex(/^[A-Z][A-Z0-9_]{1,63}$/))
    .max(10)
    .default([]),
});
export type ProviderBody = z.infer<typeof ProviderBody>;
export const ProviderUpdateBody = ProviderBody.partial().extend({
  version: z.number().int().positive(),
});
export const Provider = ProviderBody.extend({
  id: z.string(),
  version: z.number().int(),
  createdAt: z.iso.datetime(),
}).meta({ id: 'Provider' });
export type Provider = z.infer<typeof Provider>;
export const ProviderList = z.object({ data: z.array(Provider) }).meta({ id: 'ProviderList' });

export const OutboundLinkCreateBody = z.object({
  listingId: z.uuid(),
  providerId: z.uuid().nullable().optional(),
  kind: OutboundKind,
  ctaType: CtaTypeSchema,
  label: z.string().trim().max(80).nullable().optional(),
  /** Yalnızca `{subId}` ve `{surface}` yer tutucuları; kişisel veri yok. */
  urlTemplate: z.string().trim().min(10).max(1000),
  commercialRelation: CommercialRelation,
  validFrom: z.iso.datetime().nullable().optional(),
  validUntil: z.iso.datetime().nullable().optional(),
});
export type OutboundLinkCreateBody = z.infer<typeof OutboundLinkCreateBody>;
export const OutboundLinkUpdateBody = z.object({
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  label: z.string().trim().max(80).nullable().optional(),
  urlTemplate: z.string().trim().min(10).max(1000).optional(),
  validUntil: z.iso.datetime().nullable().optional(),
  version: z.number().int().positive(),
});
export const OutboundLink = z
  .object({
    id: z.string(),
    listingId: z.string().nullable(),
    provider: z
      .object({ id: z.string(), name: z.string(), integrationStatus: IntegrationStatus })
      .nullable(),
    kind: OutboundKind,
    ctaType: CtaTypeSchema,
    label: z.string().nullable(),
    urlTemplate: z.string(),
    allowedDomain: z.string().nullable(),
    commercialRelation: CommercialRelation,
    source: z.enum(['MANUAL', 'CONTACTS']),
    validFrom: z.iso.datetime().nullable(),
    validUntil: z.iso.datetime().nullable(),
    status: OutboundStatus,
    lastCheckedAt: z.iso.datetime().nullable(),
    lastCheckStatus: z.string().nullable(),
    /** Son 30 gün sayılan tıklama (bot, önceden getirme ve 30 sn tekrarları hariç). */
    clicks30d: z.number().int(),
    version: z.number().int(),
  })
  .meta({ id: 'OutboundLink' });
export type OutboundLink = z.infer<typeof OutboundLink>;
export const OutboundLinkList = z
  .object({ data: z.array(OutboundLink) })
  .meta({ id: 'OutboundLinkList' });
