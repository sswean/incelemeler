import { z } from 'zod';
import { SearchHit } from './search.js';

/** Kaydedilenler (favoriler): yalnızca sahibine görünür; sayısı herkese açık gösterilmez. */
export const FavoriteList = z
  .object({
    data: z.array(
      z.object({
        listing: SearchHit,
        createdAt: z.iso.datetime(),
      }),
    ),
  })
  .meta({ id: 'FavoriteList' });
export const FavoriteState = z.object({ saved: z.boolean() }).meta({ id: 'FavoriteState' });

/** Hesap silme (REQ-HSP-011, REQ-KVK-020/021): parola ile onay; "anonim kalsın" seçeneği L kaydına kadar kapalı. */
export const AccountDeletionBody = z.object({
  password: z.string().min(1).max(200),
  confirm: z.literal(true),
});
export const AccountDeletionPublicBody = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.trim().toLowerCase()),
});
export const TokenBody = z.object({ token: z.string().min(20).max(200) });
export const AccountDeletionStatus = z
  .object({
    status: z.enum(['PENDING_DELETION']),
    /** Silmenin uygulanacağı tarih (geri alma penceresinin sonu). */
    scheduledFor: z.iso.datetime(),
  })
  .meta({ id: 'AccountDeletionStatus' });

/** Veri dışa aktarma (REQ-HSP-012): makine tarafından okunabilir JSON; gizli alan (parola karması, token) yok. */
export const AccountExport = z
  .object({
    exportedAt: z.iso.datetime(),
    format: z.literal('incelemeler-account-export/1'),
    profile: z.object({
      email: z.string(),
      displayName: z.string(),
      emailVerifiedAt: z.iso.datetime().nullable(),
      ageConfirmedAt: z.iso.datetime().nullable(),
      termsVersion: z.string().nullable(),
      createdAt: z.iso.datetime(),
    }),
    reviews: z.array(
      z.object({
        id: z.string(),
        listing: z.object({ id: z.string(), name: z.string() }),
        rating: z.number().int(),
        title: z.string().nullable(),
        body: z.string(),
        status: z.string(),
        experienceMonth: z.string().nullable(),
        incentivized: z.boolean(),
        createdAt: z.iso.datetime(),
        publishedAt: z.iso.datetime().nullable(),
      }),
    ),
    reviewDrafts: z.array(
      z.object({ listingId: z.string(), updatedAt: z.iso.datetime(), data: z.unknown() }),
    ),
    favorites: z.array(
      z.object({ listingId: z.string(), name: z.string(), createdAt: z.iso.datetime() }),
    ),
    reports: z.array(
      z.object({
        id: z.string(),
        reason: z.string(),
        status: z.string(),
        createdAt: z.iso.datetime(),
      }),
    ),
    appeals: z.array(z.object({ id: z.string(), status: z.string(), createdAt: z.iso.datetime() })),
    sessions: z.array(
      z.object({
        createdAt: z.iso.datetime(),
        lastSeenAt: z.iso.datetime().nullable(),
        userAgent: z.string().nullable(),
      }),
    ),
  })
  .meta({ id: 'AccountExport' });
export type AccountExport = z.infer<typeof AccountExport>;
