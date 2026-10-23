import { z } from 'zod';
import { ExperienceType } from './content.js';

/**
 * Editör değerlendirmesi (REQ-VER-005): kullanıcı puanından ayrı tablo ve ayrı alan (REQ-VER-004). Her kayıt
 * yeni sürüm oluşturur; herkese açık sayfada en son yayımlanan sürüm gösterilir. Satış/sponsorluk personeli
 * yayından önce göremez (REQ-GUN-012 — `editorial.verdict.write` izni).
 */
const HalfStep = z
  .number()
  .min(0)
  .max(10)
  .refine((n) => Number.isInteger(n * 2), { message: '0,5 adımlı olmalı' });

export const VerdictCriterion = z.object({
  name: z.string().trim().min(2).max(60),
  score: HalfStep,
  weight: z.number().int().min(1).max(5),
});
export type VerdictCriterion = z.infer<typeof VerdictCriterion>;

const Lines = z.array(z.string().trim().min(2).max(200)).max(10);

export const VerdictBody = z
  .object({
    /** Önceki sürüm (iyimser kilit); ilk kayıtta 0. */
    baseVersion: z.number().int().min(0),
    experienceType: ExperienceType,
    /** "Bizzat test edildi ({süre}, {koşullar})" ayrıntısı (REQ-ICR-007). */
    experienceNote: z.string().trim().max(200).nullable(),
    testedAt: z.iso.date().nullable(),
    score: HalfStep.nullable(),
    criteria: z.array(VerdictCriterion).max(12),
    pros: Lines,
    cons: Lines,
    summary: z.string().trim().min(20).max(2000),
    articleId: z.uuid().nullable(),
  })
  .strict()
  .refine((b) => b.experienceType !== 'RESEARCH_ONLY' || (b.score === null && !b.criteria.length), {
    path: ['score'],
    message: 'Kaynaklardan derlenen değerlendirmede puan verilemez',
  })
  .refine((b) => b.experienceType === 'RESEARCH_ONLY' || b.score !== null, {
    path: ['score'],
    message: 'Deneyime dayanan değerlendirmede puan gerekli',
  })
  .refine((b) => new Set(b.criteria.map((c) => c.name)).size === b.criteria.length, {
    path: ['criteria'],
    message: 'Ölçüt adları benzersiz olmalı',
  })
  .meta({ id: 'VerdictBody' });
export type VerdictBody = z.infer<typeof VerdictBody>;

export const VerdictPublishBody = z
  .object({ version: z.number().int().min(1) })
  .strict()
  .meta({ id: 'VerdictPublishBody' });

const verdictFields = {
  version: z.number().int(),
  experienceType: ExperienceType,
  experienceNote: z.string().nullable(),
  testedAt: z.string().nullable(),
  score: z.number().nullable(),
  criteria: z.array(VerdictCriterion),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  summary: z.string(),
  author: z.object({ displayName: z.string(), slug: z.string().nullable() }),
  publishedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
};

/** Herkese açık editör değerlendirmesi: yalnızca yayımlanmış en son sürüm. */
export const PublicVerdict = z.object(verdictFields).meta({ id: 'PublicVerdict' });
export type PublicVerdict = z.infer<typeof PublicVerdict>;

export const AdminVerdict = z
  .object({ ...verdictFields, id: z.string(), articleId: z.string().nullable() })
  .meta({ id: 'AdminVerdict' });
export type AdminVerdict = z.infer<typeof AdminVerdict>;

export const AdminVerdictState = z
  .object({
    current: AdminVerdict.nullable(),
    published: AdminVerdict.nullable(),
    history: z.array(
      z.object({
        version: z.number().int(),
        authorName: z.string(),
        score: z.number().nullable(),
        createdAt: z.iso.datetime(),
        publishedAt: z.iso.datetime().nullable(),
      }),
    ),
  })
  .meta({ id: 'AdminVerdictState' });
export type AdminVerdictState = z.infer<typeof AdminVerdictState>;
