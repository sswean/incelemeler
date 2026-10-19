import { z } from 'zod';
import { SponsoredItem } from './search.js';
import { ListingKind } from './taxonomy.js';

/**
 * Sponsorlu yerleşim yüzeyleri (Ek A8.3). Render noktaları kodda sabittir; yuva kataloğu panelden yönetilir
 * ama sınırlar yalnızca düşürülebilir (REQ-SPN-001/004).
 */
export const PlacementSurface = z.enum(['SEARCH', 'CATEGORY_LIST', 'LISTING_DETAIL', 'HOME']);
export type PlacementSurface = z.infer<typeof PlacementSurface>;

/** Yüzey başına kodda sabit üst sınırlar (A8.3). Panelden yalnızca daha düşük değer girilebilir. */
export const SURFACE_CAPS: Record<
  PlacementSurface,
  { maxItems: number; positions: number[]; firstTenMax: number; minPosition: number }
> = {
  // Sayfa başına ≤ 2; ilk 10 içinde ≤ 1.
  SEARCH: { maxItems: 2, positions: [3, 13], firstTenMax: 1, minPosition: 1 },
  // Her 10 kartta ≤ 2; ardışık iki sponsorlu yok; varsayılan 3. ve 8. sıra.
  CATEGORY_LIST: { maxItems: 2, positions: [3, 8], firstTenMax: 2, minPosition: 1 },
  // ≤ 1 rakip kutu, sayfanın alt yarısında.
  LISTING_DETAIL: { maxItems: 1, positions: [1], firstTenMax: 1, minPosition: 1 },
  // ≤ 2 sponsorlu modül (D11'de render edilir).
  HOME: { maxItems: 2, positions: [2, 4], firstTenMax: 2, minPosition: 2 },
};

/**
 * Yuva yerleşim kuralı (A8.3): pozisyonlar artan, tekrar yok, ardışık değil, sayısı ≤ maxItems,
 * ilk 10 içinde ≤ firstTenMax. Panel girdisi ve sunucu bu fonksiyonla doğrulanır (REQ-SPN-004).
 */
export function slotRuleErrors(
  surface: PlacementSurface,
  maxItems: number,
  positions: readonly number[],
): string[] {
  const cap = SURFACE_CAPS[surface];
  const errors: string[] = [];
  if (maxItems < 0 || maxItems > cap.maxItems) errors.push('max_items_cap');
  if (positions.length < maxItems) errors.push('positions_count');
  const sorted = [...positions].sort((a, b) => a - b);
  if (new Set(sorted).size !== sorted.length) errors.push('positions_duplicate');
  if (sorted.some((p) => !Number.isInteger(p) || p < cap.minPosition || p > 50)) {
    errors.push('positions_range');
  }
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]! - sorted[i - 1]! < 2) errors.push('positions_adjacent');
  }
  if (sorted.slice(0, maxItems).filter((p) => p <= 10).length > cap.firstTenMax) {
    errors.push('first_ten_cap');
  }
  return [...new Set(errors)];
}

export const CampaignStatus = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'SCHEDULED',
  'LIVE',
  'PAUSED',
  'COMPLETED',
  'ARCHIVED',
  'CANCELLED',
]);
export type CampaignStatus = z.infer<typeof CampaignStatus>;

/** Yaşam döngüsü eylemleri (Ek A8.4): satış → editoryal onay → planlama. */
export const CampaignAction = z.enum([
  'submit',
  'approve_sales',
  'approve_editorial',
  'return_to_draft',
  'schedule',
  'pause',
  'resume',
  'complete',
  'archive',
  'cancel',
]);
export type CampaignAction = z.infer<typeof CampaignAction>;

/** Eylem → (kaynak durumlar, hedef durum). Onaylar hedef durumu yalnızca iki onay tamamsa APPROVED yapar. */
export const CAMPAIGN_TRANSITIONS: Record<
  CampaignAction,
  { from: readonly CampaignStatus[]; to: CampaignStatus | null }
> = {
  submit: { from: ['DRAFT'], to: 'PENDING_APPROVAL' },
  approve_sales: { from: ['PENDING_APPROVAL'], to: null },
  approve_editorial: { from: ['PENDING_APPROVAL'], to: null },
  return_to_draft: { from: ['PENDING_APPROVAL', 'APPROVED'], to: 'DRAFT' },
  schedule: { from: ['APPROVED'], to: 'SCHEDULED' },
  pause: { from: ['SCHEDULED', 'LIVE'], to: 'PAUSED' },
  resume: { from: ['PAUSED'], to: 'SCHEDULED' },
  complete: { from: ['SCHEDULED', 'LIVE', 'PAUSED'], to: 'COMPLETED' },
  archive: { from: ['COMPLETED', 'CANCELLED'], to: 'ARCHIVED' },
  cancel: {
    from: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'PAUSED'],
    to: 'CANCELLED',
  },
};

export const PlacementSlot = z
  .object({
    id: z.string(),
    key: z.string(),
    surface: PlacementSurface,
    name: z.string(),
    positions: z.array(z.number().int()),
    maxItems: z.number().int(),
    allowedKinds: z.array(ListingKind),
    enabled: z.boolean(),
    /** Kodda sabit üst sınır (panel yalnızca düşürebilir). */
    cap: z.object({ maxItems: z.number().int(), firstTenMax: z.number().int() }),
    version: z.number().int(),
  })
  .meta({ id: 'PlacementSlot' });
export type PlacementSlot = z.infer<typeof PlacementSlot>;
export const PlacementSlotList = z
  .object({ data: z.array(PlacementSlot) })
  .meta({ id: 'PlacementSlotList' });
export const PlacementSlotUpdateBody = z.object({
  positions: z.array(z.number().int().min(1).max(50)).max(10).optional(),
  maxItems: z.number().int().min(0).max(10).optional(),
  enabled: z.boolean().optional(),
  version: z.number().int().positive(),
});

export const OrganizationType = z.enum(['BUSINESS', 'BRAND', 'CHAIN', 'OPERATOR', 'ADVERTISER']);
export const OrganizationBody = z.object({
  type: OrganizationType,
  name: z.string().trim().min(2).max(160),
});
export const OrganizationSummary = z
  .object({
    id: z.string(),
    type: OrganizationType,
    slug: z.string(),
    name: z.string(),
    dataOrigin: z.string(),
  })
  .meta({ id: 'OrganizationSummary' });
export const OrganizationList = z
  .object({ data: z.array(OrganizationSummary) })
  .meta({ id: 'OrganizationList' });

const money = z.number().int().min(0).max(1_000_000_000_00);
export const CampaignCreateBody = z.object({
  name: z.string().trim().min(3).max(160),
  sponsorId: z.uuid(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  /** Kuruş; yalnızca `campaigns.amount` yetkisiyle. */
  budgetKurus: money.nullable().optional(),
  contractRef: z.string().trim().max(120).nullable().optional(),
});
export const CampaignUpdateBody = CampaignCreateBody.partial().extend({
  version: z.number().int().positive(),
});
export const CampaignTransitionBody = z.object({
  action: CampaignAction,
  version: z.number().int().positive(),
});
export const PlacementCreateBody = z.object({
  slotId: z.uuid(),
  /** Öne çıkarılan listelemenin kısa adı (slug). */
  listingSlug: z.string().trim().min(1).max(160),
  targetCategorySlug: z.string().trim().max(120).nullable().optional(),
  targetProvinceSlug: z.string().trim().max(120).nullable().optional(),
  priority: z.number().int().min(0).max(10).default(0),
  weight: z.number().int().min(1).max(100).default(1),
});
export const CreativeCreateBody = z.object({
  title: z.string().trim().min(3).max(80),
  body: z.string().trim().max(200).nullable().optional(),
});
export const CreativeReviewBody = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  version: z.number().int().positive(),
});

export const CampaignPlacement = z.object({
  id: z.string(),
  slot: z.object({ id: z.string(), key: z.string(), name: z.string(), surface: PlacementSurface }),
  listing: z.object({ id: z.string(), slug: z.string(), name: z.string() }),
  targetCategory: z.object({ slug: z.string(), name: z.string() }).nullable(),
  targetArea: z.object({ slug: z.string(), name: z.string() }).nullable(),
  priority: z.number().int(),
  weight: z.number().int(),
});
export const Creative = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  approval: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  version: z.number().int(),
});
export const Campaign = z
  .object({
    id: z.string(),
    name: z.string(),
    sponsor: z.object({ id: z.string(), name: z.string() }),
    status: CampaignStatus,
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    /** Yetkisi olmayana null döner (tutar yalnızca yönetici). */
    budgetKurus: z.number().int().nullable(),
    currency: z.string(),
    contractRef: z.string().nullable(),
    salesApprovedAt: z.iso.datetime().nullable(),
    editorialApprovedAt: z.iso.datetime().nullable(),
    dataOrigin: z.string(),
    placements: z.array(CampaignPlacement),
    creatives: z.array(Creative),
    version: z.number().int(),
  })
  .meta({ id: 'Campaign' });
export type Campaign = z.infer<typeof Campaign>;
export const CampaignListItem = Campaign.pick({
  id: true,
  name: true,
  sponsor: true,
  status: true,
  startsAt: true,
  endsAt: true,
  dataOrigin: true,
});
export const CampaignList = z
  .object({ data: z.array(CampaignListItem) })
  .meta({ id: 'CampaignList' });

const ReportRow = z.object({
  served: z.number().int(),
  viewed: z.number().int(),
  clicks: z.number().int(),
  /** Tıklama oranı = tıklama / görüntülenen gösterim; gösterim yoksa null. */
  ctr: z.number().nullable(),
});
/** Kampanya raporu (REQ-SPN-011): yalnızca gerçek, sayılan olaylar; kişisel veri yok. */
export const CampaignReport = z
  .object({
    campaignId: z.string(),
    /** Veri tazeliği: raporun hesaplandığı an. */
    generatedAt: z.iso.datetime(),
    lastEventAt: z.iso.datetime().nullable(),
    totals: ReportRow,
    daily: z.array(ReportRow.extend({ date: z.string() })),
    bySlot: z.array(ReportRow.extend({ slot: z.string(), surface: PlacementSurface })),
    /** Aynı yuvadaki kampanyalar arasında sunulma payı (adil pay — REQ-SPN-008). */
    share: z.array(z.object({ slot: z.string(), servedShare: z.number().nullable() })),
    /** Sağlayıcı dönüşüm verisi yoksa null ("Dönüşüm verisi yok"). */
    conversions: z.null(),
    /** Ayıklanan olaylar (bot, önceden getirme, tekrar, demo) — yalnızca bilgi; rapora girmez. */
    excluded: z.number().int(),
  })
  .meta({ id: 'CampaignReport' });
export type CampaignReport = z.infer<typeof CampaignReport>;

export const SponsoredEventBody = z.object({
  token: z.string().min(10).max(2000),
  type: z.literal('VIEWED'),
  /** Tarayıcı otomasyon işareti (navigator.webdriver) — bot sayılır. */
  automated: z.boolean().default(false),
});
export const SponsoredClickQuery = z.object({ ctx: z.string().max(2000).optional() });
export const SponsoredClick = z.object({ path: z.string() }).meta({ id: 'SponsoredClick' });
/** Listeleme detayındaki rakip sponsorlu kutu (≤ 1; A8.3). */
export const ListingSponsored = z
  .object({ data: z.array(SponsoredItem) })
  .meta({ id: 'ListingSponsored' });
export const SponsoredEventAck = z
  .object({ accepted: z.boolean() })
  .meta({ id: 'SponsoredEventAck' });
