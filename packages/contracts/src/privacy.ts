import { z } from 'zod';

export const DataRequestType = z.enum([
  'INFO',
  'ACCESS',
  'RECTIFICATION',
  'ERASURE',
  'OBJECTION',
  'COMPENSATION',
]);
export type DataRequestType = z.infer<typeof DataRequestType>;
export const DataRequestStatus = z.enum(['RECEIVED', 'IN_PROGRESS', 'ANSWERED', 'REJECTED']);
/** Gerekçeli ret şablonları (TASLAK; metinler hukuki incelemeyle kesinleşir). */
export const DataRequestRejection = z.enum([
  'IDENTITY_NOT_VERIFIED',
  'NOT_PERSONAL_DATA',
  'LEGAL_OBLIGATION',
  'MANIFESTLY_UNFOUNDED',
]);

/** KVKK başvurusu (REQ-KVK-022): gereksiz kimlik verisi istenmez; oturum ya da e-posta bağlantısıyla doğrulanır. */
export const DataRequestCreateBody = z.object({
  type: DataRequestType,
  email: z
    .email()
    .max(254)
    .transform((v) => v.trim().toLowerCase())
    .optional(),
  description: z.string().trim().min(10).max(4000),
});
export const DataRequestAck = z
  .object({
    accepted: z.literal(true),
    /** Girişsiz başvuruda e-postadaki bağlantıyla doğrulama gerekir. */
    verificationRequired: z.boolean(),
  })
  .meta({ id: 'DataRequestAck' });

/** Başvuru süresi uyarısı: 20. ve 27. gün uyarıları, süre aşımı alarmı. */
export const DataRequestAlert = z.enum(['NONE', 'WARN_20', 'WARN_27', 'OVERDUE']);
export const AdminDataRequest = z
  .object({
    id: z.string(),
    type: DataRequestType,
    channel: z.enum(['WEB_FORM', 'IN_APP', 'MANUAL']),
    email: z.string(),
    description: z.string(),
    identityVerified: z.boolean(),
    status: DataRequestStatus,
    receivedAt: z.iso.datetime(),
    dueAt: z.iso.datetime(),
    daysElapsed: z.number().int(),
    alert: DataRequestAlert,
    answeredAt: z.iso.datetime().nullable(),
    responseNote: z.string().nullable(),
    rejectionReason: DataRequestRejection.nullable(),
    version: z.number().int(),
  })
  .meta({ id: 'AdminDataRequest' });
export const AdminDataRequestList = z
  .object({ data: z.array(AdminDataRequest), overdue: z.number().int() })
  .meta({ id: 'AdminDataRequestList' });
export const AdminDataRequestCreateBody = z.object({
  type: DataRequestType,
  email: z
    .email()
    .max(254)
    .transform((v) => v.trim().toLowerCase()),
  description: z.string().trim().min(10).max(4000),
  /** Başka kanaldan gelen başvurunun alınma zamanı (süre bundan işler). */
  receivedAt: z.iso.datetime().optional(),
});
export const AdminDataRequestUpdateBody = z.object({
  status: DataRequestStatus,
  responseNote: z.string().trim().max(4000).nullable().optional(),
  rejectionReason: DataRequestRejection.nullable().optional(),
  identityVerified: z.boolean().optional(),
  version: z.number().int().positive(),
});

/** Uyum ayarları (`compliance_config`): süreler hukuki incelemeyle doğrulanacak varsayılanlardır (A-024). */
export const ComplianceConfig = z
  .object({
    dsrResponseDays: z.number().int().min(1).max(90),
    accountDeletionDays: z.number().int().min(1).max(90),
    retention: z.object({
      expiredTokensDays: z.number().int().min(1),
      expiredSessionsDays: z.number().int().min(1),
      reviewDraftsDays: z.number().int().min(1),
      searchEventsDays: z.number().int().min(1),
      clickSessionHashDays: z.number().int().min(1),
      consentIpHashDays: z.number().int().min(1),
      analyticsEventsDays: z.number().int().min(1),
    }),
    version: z.number().int(),
  })
  .meta({ id: 'ComplianceConfig' });
export type ComplianceConfig = z.infer<typeof ComplianceConfig>;

export const LegalDocType = z.enum(['TERMS', 'PRIVACY_NOTICE', 'COOKIE_POLICY']);
export const PendingAcceptances = z
  .object({
    data: z.array(
      z.object({
        id: z.string(),
        docType: LegalDocType,
        version: z.string(),
        effectiveAt: z.iso.datetime(),
        /** Hukukçu onayı yoksa metin TASLAK'tır. */
        draft: z.boolean(),
      }),
    ),
  })
  .meta({ id: 'PendingAcceptances' });
export const LegalAcceptBody = z.object({ versionIds: z.array(z.uuid()).min(1).max(5) });

export const BreachCreateBody = z.object({
  detectedAt: z.iso.datetime(),
  summary: z.string().trim().min(10).max(4000),
  dataCategories: z.array(z.string().trim().min(2).max(60)).max(20).default([]),
  affectedCount: z.number().int().min(0).nullable().optional(),
});
export const BreachIncident = z
  .object({
    id: z.string(),
    detectedAt: z.iso.datetime(),
    summary: z.string(),
    stage: z.enum(['DETECTED', 'CONTAINED', 'ASSESSED', 'NOTIFIED', 'CLOSED']),
    dataCategories: z.array(z.string()),
    affectedCount: z.number().int().nullable(),
    notifyDeadline: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'BreachIncident' });
export const BreachList = z.object({ data: z.array(BreachIncident) }).meta({ id: 'BreachList' });
