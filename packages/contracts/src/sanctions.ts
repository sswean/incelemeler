import { z } from 'zod';

/**
 * Hesap yaptırım basamakları (REQ-GUN-007): uyarı → değerlendirme hakkının geçici kısıtlanması → askıya alma →
 * kalıcı kapatma. Her adım gerekçeli, e-postayla bildirilir ve 14 gün içinde bir kez itiraz edilebilir; itirazı
 * yaptırımı verenden farklı moderatör inceler (REQ-GUN-003).
 */
export const SanctionLevel = z.enum([
  'WARNING',
  'REVIEW_RESTRICTION',
  'SUSPENSION',
  'PERMANENT_BAN',
]);
export type SanctionLevel = z.infer<typeof SanctionLevel>;
export const SANCTION_LADDER: readonly SanctionLevel[] = SanctionLevel.options;
/** Süreli basamaklar (gün). */
export const TIMED_LEVELS: ReadonlySet<SanctionLevel> = new Set([
  'REVIEW_RESTRICTION',
  'SUSPENSION',
]);

export const SanctionReason = z.enum([
  'FAKE_REVIEWS',
  'UNDECLARED_INCENTIVE',
  'HATE_OR_HARASSMENT',
  'THREAT',
  'PERSONAL_DATA',
  'SPAM',
  'REPEATED_VIOLATIONS',
  'BAN_EVASION',
]);
export type SanctionReason = z.infer<typeof SanctionReason>;

export const SanctionCreateBody = z
  .object({
    email: z.email().max(254),
    level: SanctionLevel,
    reasonCode: SanctionReason,
    note: z.string().trim().min(5).max(1000),
    /** Süreli basamaklarda zorunlu (1–90 gün). */
    durationDays: z.number().int().min(1).max(90).optional(),
    /** Önerilen basamağı atlama (ağır ihlal) — notta gerekçe. */
    skipLevel: z.boolean().default(false),
  })
  .strict()
  .refine((b) => TIMED_LEVELS.has(b.level) === (b.durationDays !== undefined), {
    path: ['durationDays'],
    message: 'Süre yalnızca kısıtlama ve askıda, onlarda zorunlu',
  })
  .meta({ id: 'SanctionCreateBody' });
export type SanctionCreateBody = z.infer<typeof SanctionCreateBody>;

export const AdminSanction = z
  .object({
    id: z.string(),
    user: z.object({ id: z.string(), displayName: z.string(), email: z.string() }),
    level: SanctionLevel,
    reasonCode: SanctionReason,
    note: z.string(),
    skippedLevel: z.boolean(),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime().nullable(),
    active: z.boolean(),
    issuedById: z.string(),
    revokedAt: z.iso.datetime().nullable(),
    appeal: z
      .object({
        statement: z.string(),
        appealedAt: z.iso.datetime(),
        outcome: z.enum(['UPHELD', 'OVERTURNED']).nullable(),
        note: z.string().nullable(),
      })
      .nullable(),
    version: z.number().int(),
  })
  .meta({ id: 'AdminSanction' });
export type AdminSanction = z.infer<typeof AdminSanction>;

export const AdminSanctionList = z
  .object({ active: z.array(AdminSanction), appeals: z.array(AdminSanction) })
  .meta({ id: 'AdminSanctionList' });

export const SanctionCreated = z
  .object({ sanction: AdminSanction, suggestedLevel: SanctionLevel })
  .meta({ id: 'SanctionCreated' });

export const SanctionAppealBody = z
  .object({ token: z.string().min(20).max(400), statement: z.string().trim().min(10).max(2000) })
  .strict()
  .meta({ id: 'SanctionAppealBody' });
export const SanctionAppealDecisionBody = z
  .object({
    version: z.number().int().min(1),
    outcome: z.enum(['UPHELD', 'OVERTURNED']),
    note: z.string().trim().min(5).max(1000),
  })
  .strict()
  .meta({ id: 'SanctionAppealDecisionBody' });

/** Toplu sahte değerlendirme temizliği: seçilen değerlendirmeler kaldırılır, ortalamadan çıkar, bildirim yazılır. */
export const IntegrityActionBody = z
  .object({
    reviewIds: z.array(z.uuid()).min(1).max(200),
    note: z.string().trim().min(5).max(1000),
  })
  .strict()
  .meta({ id: 'IntegrityActionBody' });
export const IntegrityActionResult = z
  .object({ removed: z.number().int(), noticeId: z.string() })
  .meta({ id: 'IntegrityActionResult' });

/** Önerilen sonraki basamak: son 365 gündeki en yüksek etkin olmayan/etkin yaptırımın bir üstü. */
export function nextSanctionLevel(history: readonly SanctionLevel[]): SanctionLevel {
  const top = Math.max(-1, ...history.map((l) => SANCTION_LADDER.indexOf(l)));
  return SANCTION_LADDER[Math.min(top + 1, SANCTION_LADDER.length - 1)]!;
}
