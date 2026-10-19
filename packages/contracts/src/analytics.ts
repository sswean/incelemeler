import { z } from 'zod';
import { ListingKind } from './taxonomy.js';

/**
 * Birinci taraf istemci olayları (REQ-ANL-001/002): yalnızca analitik onayıyla gönderilir; kişisel veri yok.
 * Anonim kimlik istemciden alınmaz — sunucu tercih çerezinden okur. Sözlük: docs/analytics/olay-sozlugu.md
 */
export const ANALYTICS_EVENTS = {
  landing: z.object({ source: z.enum(['search', 'social', 'direct', 'internal', 'other']) }),
  listing_viewed: z.object({ listingId: z.uuid(), kind: ListingKind }),
  content_viewed: z.object({ articleId: z.uuid() }),
  category_viewed: z.object({
    hubPath: z
      .string()
      .max(200)
      .regex(/^\/[a-z0-9/-]*$/),
  }),
  engaged_30s: z.object({ pageType: z.enum(['listing', 'content']) }),
  favorite_added: z.object({ listingId: z.uuid() }),
  outbound_click: z.object({ listingId: z.uuid(), ctaType: z.string().max(40) }),
} as const;
export type AnalyticsEventName = keyof typeof ANALYTICS_EVENTS;
export const AnalyticsEventName = z.enum(
  Object.keys(ANALYTICS_EVENTS) as [AnalyticsEventName, ...AnalyticsEventName[]],
);

/** Yalnızca yol (sorgu dizesi yok: arama terimi ya da belirteç sızmasın). */
const path = z
  .string()
  .max(300)
  .regex(/^\/[^?#\s]*$/);

export const AnalyticsEventBody = z
  .object({
    name: AnalyticsEventName,
    /** Sekme başına rastgele oturum kimliği (sessionStorage); kişisel veri değildir. */
    sessionId: z.uuid(),
    path,
    props: z.record(z.string(), z.unknown()),
    /** Sayfa demo içerik gösteriyorsa (raporlara girmez). */
    demo: z.boolean().default(false),
    /** Tarayıcı otomasyonu (navigator.webdriver) — bot sayılır. */
    automated: z.boolean().default(false),
  })
  .superRefine((v, ctx) => {
    const r = ANALYTICS_EVENTS[v.name].safeParse(v.props);
    if (!r.success)
      ctx.addIssue({ code: 'custom', path: ['props'], message: 'Geçersiz olay özellikleri' });
  });
export type AnalyticsEventBody = z.infer<typeof AnalyticsEventBody>;

/** Ziyaretçinin gönderdiği olay sunucuda bu alanlarla zenginleşir (web vekili). */
export const AnalyticsIngestBody = z.object({
  event: AnalyticsEventBody,
  anonymousId: z.uuid(),
});

const count = z.number().int().nullable();
/** Panolar (REQ-ANL-004): yalnızca gerçek kayıtlardan; veri yoksa null ("Veri yok"). */
export const AnalyticsOverview = z
  .object({
    generatedAt: z.iso.datetime(),
    days: z.number().int(),
    /** Rızalı ölçüm: farklı anonim kimlik sayısı. */
    activeVisitors: count,
    /** Kuzey yıldızı: nitelikli karar oturumu (≥ 30 sn okuma, kaydetme ya da dış yönlendirme). */
    qualifiedSessions: count,
    landings: z.array(z.object({ source: z.string(), count: z.number().int() })),
    searches: z.object({
      total: count,
      zeroResult: count,
      zeroRate: z.number().nullable(),
      /** k-anonimlik: en az 3 kez aranan sorgular. */
      top: z.array(z.object({ query: z.string(), count: z.number().int() })),
      topZero: z.array(z.object({ query: z.string(), count: z.number().int() })),
    }),
    outbound: z.object({
      total: count,
      byKind: z.array(z.object({ kind: z.string(), count: z.number().int() })),
    }),
    sponsored: z.object({ served: count, viewed: count, clicks: count }),
    content: z.object({
      publishedListings: z.array(z.object({ category: z.string(), count: z.number().int() })),
      publishedArticles: count,
      staleListings: count,
    }),
    reviews: z.object({
      submitted: count,
      published: count,
      removed: count,
      removalReasons: z.array(z.object({ reason: z.string(), count: z.number().int() })),
    }),
    moderation: z.object({
      pending: z.number().int(),
      medianWaitHours: z.number().nullable(),
    }),
    favoritesAdded: count,
    /** Faz 3 işletme/reklamveren başvuruları henüz yok. */
    applications: z.null(),
    guardrails: z.object({
      /** Sunulan sponsorlu öğe / arama sayısı. */
      sponsoredPerSearch: z.number().nullable(),
      reviewRemovalRate: z.number().nullable(),
    }),
  })
  .meta({ id: 'AnalyticsOverview' });
export type AnalyticsOverview = z.infer<typeof AnalyticsOverview>;
export const AnalyticsOverviewQuery = z.object({
  days: z.coerce
    .number()
    .int()
    .refine((v) => v === 7 || v === 30 || v === 90, 'Geçersiz dönem')
    .default(7),
});

/** Genel pano (REQ-ADM-002): yalnızca gerçek sayaçlar. */
export const AdminDashboard = z
  .object({
    generatedAt: z.iso.datetime(),
    pendingModeration: z.number().int(),
    openReports: z.number().int(),
    staleListings: z.number().int(),
    openDataRequests: z.number().int(),
    overdueDataRequests: z.number().int(),
    activeCampaigns: z.number().int(),
    applications: z.null(),
    last7Days: z.object({
      searches: z.number().int(),
      outboundClicks: z.number().int(),
      reviewsSubmitted: z.number().int(),
      favoritesAdded: z.number().int(),
    }),
  })
  .meta({ id: 'AdminDashboard' });

/** Gelir raporu (REQ-ADM-010): yalnızca elle girilen anlaşma tutarları; kaynak etiketli. */
export const RevenueQuery = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
});
export const RevenueReport = z
  .object({
    generatedAt: z.iso.datetime(),
    from: z.string(),
    to: z.string(),
    sponsorship: z.array(
      z.object({
        campaignId: z.string(),
        campaign: z.string(),
        sponsor: z.string(),
        status: z.string(),
        startsAt: z.iso.datetime(),
        endsAt: z.iso.datetime(),
        amountKurus: z.number().int().nullable(),
        source: z.literal('MANUAL_CONTRACT'),
      }),
    ),
    sponsorshipTotalKurus: z.number().int().nullable(),
    /** Sağlayıcı raporu/içe aktarma yok → null ("Veri yok"). */
    affiliateEstimatedKurus: z.null(),
    affiliateConfirmedKurus: z.null(),
  })
  .meta({ id: 'RevenueReport' });
export type RevenueReport = z.infer<typeof RevenueReport>;
