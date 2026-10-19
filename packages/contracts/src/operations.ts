import { z } from 'zod';

/**
 * Merkezi, tipli özellik bayrağı kaydı (§12.8, REQ-MIM-017). Faz 1'de uzaktan bayrak servisi yok: durum kodda,
 * her bayrak bir REQ'e bağlı. Üretimde yalnızca ACIK özellikler çalışır; MOCK ve YALNIZCA_GELISTIRME render edilmez.
 * `capabilities.*` entegrasyon yetenekleridir (sağlayıcı yokken KAPALI).
 */
export const FeatureState = z.enum(['KAPALI', 'YALNIZCA_GELISTIRME', 'MOCK', 'ACIK']);
export type FeatureState = z.infer<typeof FeatureState>;

export const FEATURE_FLAGS = {
  'reviews.photoUploads': {
    state: 'KAPALI',
    req: 'REQ-GUN-006',
    note: 'Kötü amaçlı içerik taraması (X-010) bekleniyor',
  },
  'applications.documentUpload': { state: 'KAPALI', req: 'REQ-ISL-001', note: 'X-010 bekleniyor' },
  'antiAbuse.captcha': {
    state: 'KAPALI',
    req: 'REQ-GUN-008',
    note: 'Sağlayıcı seçimi (X kaydı) bekleniyor',
  },
  'capabilities.livePrices': { state: 'KAPALI', req: 'REQ-ENT-011', note: 'Fiyat sağlayıcısı yok' },
  'capabilities.hotelAvailability': {
    state: 'KAPALI',
    req: 'REQ-ENT-013',
    note: 'Konaklama sağlayıcısı yok',
  },
  'capabilities.carRentalAvailability': {
    state: 'KAPALI',
    req: 'REQ-ENT-013',
    note: 'Araç kiralama sağlayıcısı yok',
  },
  'capabilities.map': {
    state: 'KAPALI',
    req: 'REQ-ERS-007',
    note: 'Harita sağlayıcısı (X-005) bekleniyor',
  },
  'sponsorship.placements': {
    state: 'ACIK',
    req: 'REQ-SPN-001',
    note: 'Acil kapatma: işletim anahtarı',
  },
  'analytics.firstParty': {
    state: 'ACIK',
    req: 'REQ-ANL-001',
    note: 'Yalnızca analitik rızasıyla',
  },
  'applications.publicForms': { state: 'ACIK', req: 'REQ-ISL-001', note: '' },
} as const satisfies Record<string, { state: FeatureState; req: string; note: string }>;
export type FeatureName = keyof typeof FEATURE_FLAGS;

/** Ortamda özellik çalışır mı: üretimde yalnızca ACIK; yerel/test/staging'de MOCK ve YALNIZCA_GELISTIRME de. */
export function featureEnabled(
  name: FeatureName,
  appEnv: 'local' | 'test' | 'staging' | 'production',
): boolean {
  const state: FeatureState = FEATURE_FLAGS[name].state;
  if (state === 'ACIK') return true;
  if (state === 'KAPALI') return false;
  return appEnv !== 'production';
}

/**
 * Acil kapatma anahtarları ve bakım modu (REQ-OPS-009): panelden, gerekçeli ve denetim kayıtlı. Varsayılan: her şey
 * açık, bakım kapalı.
 */
export const OpsSwitches = z
  .object({
    maintenanceMode: z.boolean(),
    sponsoredDisabled: z.boolean(),
    reviewsDisabled: z.boolean(),
    registrationDisabled: z.boolean(),
    integrationsDisabled: z.boolean(),
  })
  .meta({ id: 'OpsSwitches' });
export type OpsSwitches = z.infer<typeof OpsSwitches>;
export const DEFAULT_OPS_SWITCHES: OpsSwitches = {
  maintenanceMode: false,
  sponsoredDisabled: false,
  reviewsDisabled: false,
  registrationDisabled: false,
  integrationsDisabled: false,
};
export const AdminOpsSwitches = OpsSwitches.extend({
  version: z.number().int(),
  updatedAt: z.iso.datetime().nullable(),
}).meta({ id: 'AdminOpsSwitches' });
export const OpsSwitchesUpdateBody = OpsSwitches.partial()
  .extend({
    version: z.number().int().min(0),
    /** Denetim kaydı için gerekçe. */
    reason: z.string().trim().min(5).max(500),
  })
  .strict()
  .meta({ id: 'OpsSwitchesUpdateBody' });

/** Herkese açık işletim durumu (web vekili bakım sayfası için). */
export const OpsStatus = z
  .object({ maintenance: z.boolean(), reviewsOpen: z.boolean(), registrationOpen: z.boolean() })
  .meta({ id: 'OpsStatus' });
