import { z } from 'zod';

/**
 * Hukuki talepler ve bildirim-kaldırma (REQ-GUN-005). Herkese açık formda yalnızca hak sahibi/temsilci talepleri;
 * mahkeme ve idari kararlar ayrı akışta (yalnızca panel, karar referansıyla). Yanıt süreleri `compliance_config`'ten
 * (varsayılanlar hukuken doğrulanacak — L-013).
 */
export const TakedownKind = z.enum([
  'COPYRIGHT',
  'PERSONALITY_RIGHTS',
  'OTHER_LEGAL',
  'COURT_ORDER',
  'ADMINISTRATIVE_ORDER',
]);
export type TakedownKind = z.infer<typeof TakedownKind>;
export const PublicTakedownKind = TakedownKind.extract([
  'COPYRIGHT',
  'PERSONALITY_RIGHTS',
  'OTHER_LEGAL',
]);
export const ORDER_KINDS: ReadonlySet<TakedownKind> = new Set([
  'COURT_ORDER',
  'ADMINISTRATIVE_ORDER',
]);
export const TakedownStatus = z.enum([
  'RECEIVED',
  'IN_REVIEW',
  'ACTIONED',
  'REJECTED',
  'WITHDRAWN',
]);
export type TakedownStatus = z.infer<typeof TakedownStatus>;
export const RequesterCapacity = z.enum([
  'RIGHT_HOLDER',
  'REPRESENTATIVE',
  'AFFECTED_PERSON',
  'AUTHORITY',
  'OTHER',
]);
export const TakedownRejection = z.enum([
  'INSUFFICIENT_INFORMATION',
  'NOT_UNLAWFUL',
  'NOT_OUR_CONTENT',
  'ALREADY_REMOVED',
  'ABUSIVE_REQUEST',
]);
export const TakedownTargetType = z.enum(['review', 'listing', 'article', 'media', 'other']);

const common = {
  requesterName: z.string().trim().min(2).max(120),
  requesterOrg: z.string().trim().min(2).max(160).optional(),
  requesterEmail: z
    .string()
    .trim()
    .max(254)
    .email()
    .transform((v) => v.toLowerCase()),
  requesterCapacity: RequesterCapacity,
  legalBasis: z.string().trim().min(20).max(4000),
  targetUrl: z.url({ protocol: /^https?$/ }).max(500),
  documentsNote: z.string().trim().max(1000).optional(),
};

export const TakedownCreateBody = z
  .object({
    kind: PublicTakedownKind,
    ...common,
    /** İyi niyet ve doğruluk beyanı. */
    goodFaithAck: z.literal(true),
  })
  .strict()
  .meta({ id: 'TakedownCreateBody' });

export const AdminTakedownCreateBody = z
  .object({
    kind: TakedownKind,
    ...common,
    authorityReference: z.string().trim().min(3).max(200).optional(),
    receivedAt: z.iso.datetime().optional(),
  })
  .strict()
  .refine((b) => !ORDER_KINDS.has(b.kind) || b.authorityReference, {
    path: ['authorityReference'],
    message: 'Resmî kararlarda karar sayısı/tarihi zorunlu',
  })
  .meta({ id: 'AdminTakedownCreateBody' });

export const TakedownUpdateBody = z
  .object({
    version: z.number().int().min(1),
    status: TakedownStatus.exclude(['RECEIVED']),
    targetType: TakedownTargetType.optional(),
    targetId: z.uuid().optional(),
    /** ACTIONED + değerlendirme hedefi: değerlendirme hukuki gerekçeyle kaldırılır. */
    removeTarget: z.boolean().default(false),
    rejectionReason: TakedownRejection.optional(),
    decisionNote: z.string().trim().min(3).max(2000).optional(),
  })
  .strict()
  .refine((b) => b.status !== 'REJECTED' || b.rejectionReason, {
    path: ['rejectionReason'],
    message: 'Ret gerekçesi zorunlu',
  })
  .refine(
    (b) => !b.removeTarget || (b.status === 'ACTIONED' && b.targetType === 'review' && b.targetId),
    {
      path: ['removeTarget'],
      message: 'Otomatik kaldırma yalnızca işlem yapılan değerlendirme hedefinde',
    },
  )
  .meta({ id: 'TakedownUpdateBody' });
export type TakedownUpdateBody = z.infer<typeof TakedownUpdateBody>;

export const TakedownAlert = z.enum(['NONE', 'DUE_SOON', 'OVERDUE']);
export const AdminTakedown = z
  .object({
    id: z.string(),
    kind: TakedownKind,
    channel: z.enum(['WEB_FORM', 'MANUAL']),
    requesterName: z.string(),
    requesterOrg: z.string().nullable(),
    requesterEmail: z.string(),
    requesterCapacity: RequesterCapacity,
    legalBasis: z.string(),
    authorityReference: z.string().nullable(),
    targetUrl: z.string(),
    targetType: TakedownTargetType.nullable(),
    targetId: z.string().nullable(),
    documentsNote: z.string().nullable(),
    status: TakedownStatus,
    receivedAt: z.iso.datetime(),
    dueAt: z.iso.datetime(),
    hoursLeft: z.number(),
    alert: TakedownAlert,
    decidedAt: z.iso.datetime().nullable(),
    rejectionReason: TakedownRejection.nullable(),
    decisionNote: z.string().nullable(),
    version: z.number().int(),
  })
  .meta({ id: 'AdminTakedown' });
export type AdminTakedown = z.infer<typeof AdminTakedown>;
export const AdminTakedownList = z
  .object({ data: z.array(AdminTakedown), overdue: z.number().int() })
  .meta({ id: 'AdminTakedownList' });
export const TakedownAck = z
  .object({ accepted: z.literal(true), reference: z.string(), dueAt: z.iso.datetime() })
  .meta({ id: 'TakedownAck' });

/** Süre uyarısı: kalan süre yanıt süresinin %25'inden azsa yakında, geçtiyse süresi geçti. */
export function takedownAlert(
  r: { status: TakedownStatus; receivedAt: Date; dueAt: Date },
  now = new Date(),
): z.infer<typeof TakedownAlert> {
  if (['ACTIONED', 'REJECTED', 'WITHDRAWN'].includes(r.status)) return 'NONE';
  const total = r.dueAt.getTime() - r.receivedAt.getTime();
  const left = r.dueAt.getTime() - now.getTime();
  if (left <= 0) return 'OVERDUE';
  return left <= total / 4 ? 'DUE_SOON' : 'NONE';
}
