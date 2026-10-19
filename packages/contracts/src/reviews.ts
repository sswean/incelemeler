import { z } from 'zod';

/**
 * Kullanıcı değerlendirmeleri ve moderasyon (Ek A6.4–A6.6, REQ-VER-006/007, REQ-DEG-*, REQ-GUN-*).
 * Kullanıcı puanı 1–5 tam yıldızdır; editör puanıyla ASLA birleştirilmez (REQ-VER-004).
 */

/**
 * Durumlar: PENDING "İncelemede" · PUBLISHED "Yayında" · REJECTED "Yayımlanmadı" (gerekçe + yeniden gönder) ·
 * REMOVED "Kaldırıldı" · WITHDRAWN kullanıcı geri çekti. "Bildirildi" ve "İtiraz edildi" ayrı kayıtlardan türer.
 */
export const ReviewStatus = z.enum(['PENDING', 'PUBLISHED', 'REJECTED', 'REMOVED', 'WITHDRAWN']);
export type ReviewStatus = z.infer<typeof ReviewStatus>;

export const ReviewVerification = z.enum(['SELF_DECLARED', 'DOCUMENTED', 'PROVIDER_VERIFIED']);
export type ReviewVerification = z.infer<typeof ReviewVerification>;

/** Ziyaret/yolculuk türü (konaklamada zorunlu — A6.3). */
export const VisitContext = z.enum(['SOLO', 'COUPLE', 'FAMILY', 'FRIENDS', 'BUSINESS']);
export type VisitContext = z.infer<typeof VisitContext>;

/** Ürünlerde kullanım süresi (A6.3). */
export const UsageDuration = z.enum(['LT_1M', 'M1_6', 'M6_12', 'GT_12M']);
export type UsageDuration = z.infer<typeof UsageDuration>;

/**
 * Moderasyon gerekçe kodları (REQ-GUN-001/004). "İşletme beğenmedi" bir gerekçe DEĞİLDİR; kaldırma yalnızca
 * içerik politikası ihlali, hukuki talep/karar ya da kullanıcının kendi talebiyle olur.
 */
export const ModerationReason = z.enum([
  'NOT_PERSONAL_EXPERIENCE',
  'HATE_OR_HARASSMENT',
  'THREAT',
  'PERSONAL_DATA',
  'DOXXING',
  'ADVERTISING_OR_SPAM',
  'OFF_TOPIC',
  'COPIED_CONTENT',
  'UNDECLARED_INCENTIVE',
  'HEALTH_CLAIM',
  'CONFLICT_OF_INTEREST',
  'DUPLICATE',
  'LEGAL_REQUEST',
  'COURT_ORDER',
  'USER_REQUEST',
]);
export type ModerationReason = z.infer<typeof ModerationReason>;

/** Bildir nedenleri (sabit liste — REQ-GUN-002). */
export const ReportReason = z.enum([
  'FAKE_OR_NOT_EXPERIENCE',
  'HATE_OR_HARASSMENT',
  'PERSONAL_DATA',
  'SPAM_OR_AD',
  'OFF_TOPIC',
  'COPYRIGHT',
  'CONFLICT_OF_INTEREST',
  'LEGAL',
  'OTHER',
]);
export type ReportReason = z.infer<typeof ReportReason>;

const month = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
  .refine((m) => m >= '2000-01', 'Çok eski tarih');

/** Önceden işaretli kutu yok (A6.4): beyanlar açıkça gönderilmeli. */
export const ReviewDeclarations = z.object({
  ownExperience: z.literal(true),
  noConflict: z.literal(true),
  /** "Bu deneyim için ücret, ücretsiz hizmet/ürün, indirim ya da hediye aldın mı?" — yanıt zorunlu. */
  incentivized: z.boolean(),
});

export const ReviewBody = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(100).nullable().optional(),
  body: z.string().trim().min(50).max(5000),
  criteriaRatings: z
    .array(z.object({ criterionId: z.uuid(), rating: z.number().int().min(1).max(5) }))
    .max(6)
    .default([]),
  experienceMonth: month.nullable().optional(),
  usageDuration: UsageDuration.nullable().optional(),
  visitContext: VisitContext.nullable().optional(),
  declarations: ReviewDeclarations,
  language: z
    .string()
    .regex(/^[a-z]{2}$/)
    .default('tr'),
});
export type ReviewBody = z.infer<typeof ReviewBody>;

export const ReviewCreateBody = ReviewBody.extend({ listingId: z.uuid() });
export type ReviewCreateBody = z.infer<typeof ReviewCreateBody>;
export const ReviewUpdateBody = ReviewBody.extend({ version: z.number().int().positive() });
export type ReviewUpdateBody = z.infer<typeof ReviewUpdateBody>;

/** Üye taslağı (hesapta): kısmi, doğrulanmamış form durumu. */
export const ReviewDraftBody = z.object({
  data: z.record(z.string(), z.unknown()).refine((d) => JSON.stringify(d).length <= 20_000),
});
export const ReviewDraft = z
  .object({
    listingId: z.string(),
    data: z.record(z.string(), z.unknown()),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: 'ReviewDraft' });

export const PublicReview = z
  .object({
    id: z.string(),
    rating: z.number().int(),
    title: z.string().nullable(),
    body: z.string(),
    criteriaRatings: z.array(z.object({ name: z.string(), rating: z.number().int() })),
    experienceMonth: z.string().nullable(),
    usageDuration: UsageDuration.nullable(),
    visitContext: VisitContext.nullable(),
    verification: ReviewVerification,
    /** "Ücretsiz/indirimli deneyim beyan edildi" etiketi; ortalamaya girmez. */
    incentivized: z.boolean(),
    author: z.object({ displayName: z.string() }),
    publishedAt: z.iso.datetime(),
    editedAt: z.iso.datetime().nullable(),
  })
  .meta({ id: 'PublicReview' });
export type PublicReview = z.infer<typeof PublicReview>;

/** Gösterim eşikleri uygulanmış özet (A6.2): n < 3 iken ortalama YOK. */
export const RatingSummary = z
  .object({
    count: z.number().int(),
    display: z.enum(['none', 'insufficient', 'average']),
    /** Yalnızca display = average iken. */
    average: z.number().nullable(),
    /** n ≥ 5 iken 1–5 dağılımı (index 0 = 1 yıldız). */
    distribution: z.array(z.number().int()).nullable(),
    criteria: z
      .array(z.object({ name: z.string(), average: z.number(), count: z.number().int() }))
      .nullable(),
    /** Son 12 ayda ≥ 5 (mekan, konaklama, hizmet) iken. */
    last12: z.object({ count: z.number().int(), average: z.number() }).nullable(),
  })
  .meta({ id: 'RatingSummary' });
export type RatingSummary = z.infer<typeof RatingSummary>;

export const ReviewSort = z.enum(['newest', 'highest', 'lowest', 'documented']);
export const ReviewListQuery = z.object({
  sort: ReviewSort.default('newest'),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  visitContext: VisitContext.optional(),
  documented: z.enum(['true']).optional(),
  page: z.coerce.number().int().min(1).max(100).default(1),
});
export type ReviewListQuery = z.infer<typeof ReviewListQuery>;

export const ReviewList = z
  .object({
    summary: RatingSummary,
    data: z.array(PublicReview),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  })
  .meta({ id: 'ReviewList' });
export type ReviewList = z.infer<typeof ReviewList>;

export const AppealState = z.enum(['NONE', 'AVAILABLE', 'OPEN', 'UPHELD', 'OVERTURNED']);

/** "Değerlendirmelerim": sahibine görünen durum, gerekçe ve itiraz bilgisi. */
export const MyReview = z
  .object({
    id: z.string(),
    listing: z.object({ id: z.string(), name: z.string(), path: z.string() }),
    rating: z.number().int(),
    title: z.string().nullable(),
    body: z.string(),
    status: ReviewStatus,
    /** Yayında ve hakkında açık bildirim var ("Bildirildi" — karar verilene kadar yayında). */
    reported: z.boolean(),
    reasonCode: ModerationReason.nullable(),
    reasonNote: z.string().nullable(),
    appeal: AppealState,
    appealDeadline: z.iso.datetime().nullable(),
    incentivized: z.boolean(),
    criteriaRatings: z.array(z.object({ criterionId: z.string(), rating: z.number().int() })),
    experienceMonth: z.string().nullable(),
    usageDuration: UsageDuration.nullable(),
    visitContext: VisitContext.nullable(),
    createdAt: z.iso.datetime(),
    editedAt: z.iso.datetime().nullable(),
    version: z.number().int(),
  })
  .meta({ id: 'MyReview' });
export type MyReview = z.infer<typeof MyReview>;
export const MyReviewList = z.object({ data: z.array(MyReview) }).meta({ id: 'MyReviewList' });

export const ReportCreateBody = z.object({
  targetType: z.enum(['REVIEW']),
  targetId: z.uuid(),
  reason: ReportReason,
  description: z.string().trim().max(2000).nullable().optional(),
  /** Misafir bildiriminde durum bildirimi için (isteğe bağlı). */
  email: z.email().max(254).nullable().optional(),
});
export const ReportAck = z
  .object({ id: z.string(), status: z.literal('OPEN') })
  .meta({ id: 'ReportAck' });

export const AppealCreateBody = z
  .object({
    reviewId: z.uuid().optional(),
    reportId: z.uuid().optional(),
    statement: z.string().trim().min(20).max(2000),
  })
  .refine((b) => Boolean(b.reviewId) !== Boolean(b.reportId), 'reviewId ya da reportId');
export const AppealAck = z
  .object({ id: z.string(), status: z.literal('OPEN') })
  .meta({ id: 'AppealAck' });

// ── Moderasyon (panel) ──

export const ModerationSignal = z.object({
  code: z.string(),
  weight: z.number().int(),
  detail: z.string().nullable(),
});

export const ModerationQueueQuery = z.object({
  queue: z.enum(['pending', 'post', 'reports', 'appeals']).default('pending'),
});

export const ModerationItem = z.object({
  kind: z.enum(['REVIEW', 'REPORT', 'APPEAL']),
  id: z.string(),
  review: z.object({
    id: z.string(),
    rating: z.number().int(),
    title: z.string().nullable(),
    body: z.string(),
    status: ReviewStatus,
    riskScore: z.number().int(),
    signals: z.array(ModerationSignal),
    incentivized: z.boolean(),
    author: z.object({ id: z.string(), displayName: z.string() }),
    listing: z.object({ id: z.string(), name: z.string() }),
    version: z.number().int(),
    createdAt: z.iso.datetime(),
    moderatedById: z.string().nullable(),
    reasonCode: ModerationReason.nullable(),
  }),
  report: z
    .object({ reason: ReportReason, description: z.string().nullable(), count: z.number().int() })
    .nullable(),
  appeal: z
    .object({ statement: z.string(), against: z.enum(['REVIEW_DECISION', 'REPORT_DECISION']) })
    .nullable(),
  /** SLA: ilk kayıttan bu yana geçen saat (REQ-GUN-001). */
  ageHours: z.number(),
  priority: z.number().int(),
});
export const ModerationQueue = z
  .object({ data: z.array(ModerationItem), counts: z.record(z.string(), z.number().int()) })
  .meta({ id: 'ModerationQueue' });
export type ModerationQueue = z.infer<typeof ModerationQueue>;

export const ReviewDecisionBody = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'REMOVE']),
  reasonCode: ModerationReason.optional(),
  note: z.string().trim().max(1000).nullable().optional(),
  version: z.number().int().positive(),
});
export const ReportDecisionBody = z.object({
  action: z.enum(['DISMISS', 'REMOVE_TARGET']),
  reasonCode: ModerationReason.optional(),
  note: z.string().trim().max(1000).nullable().optional(),
});
export const AppealDecisionBody = z.object({
  outcome: z.enum(['UPHELD', 'OVERTURNED']),
  /** Bildirim reddine yapılan itiraz kabul edilip içerik kaldırılırken zorunlu. */
  reasonCode: ModerationReason.optional(),
  note: z.string().trim().min(5).max(1000),
});
export const DecisionAck = z.object({ ok: z.literal(true) }).meta({ id: 'DecisionAck' });

/** Değerlendirme formu bağlamı: listeleme, kategori kriterleri ve türe göre zorunlu alanlar (A6.3). */
export const ReviewFormContext = z
  .object({
    listing: z.object({ id: z.string(), name: z.string(), kind: z.string(), path: z.string() }),
    criteria: z.array(
      z.object({ id: z.string(), name: z.string(), description: z.string().nullable() }),
    ),
    /** Ürün/eser: kullanım süresi; diğerleri: deneyim ayı. */
    usesDuration: z.boolean(),
    requiresVisitContext: z.boolean(),
    ugcEnabled: z.boolean(),
  })
  .meta({ id: 'ReviewFormContext' });
export type ReviewFormContext = z.infer<typeof ReviewFormContext>;
