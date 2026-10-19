import type { ListingKind } from './taxonomy.js';

/** Birincil eylem türleri (Ek A4.4, Ek A9). Bağlamsız CTA yasaktır. */
export type CtaType =
  | 'DIRECTIONS'
  | 'CALL'
  | 'WEBSITE'
  | 'OFFICIAL_SITE'
  | 'RESERVATION'
  | 'PROVIDER_PRICES'
  | 'PROVIDER_DATES'
  | 'SELLER'
  | 'TICKETS'
  | 'CONTACT'
  | 'APPOINTMENT'
  | 'READ_GUIDE'
  | 'EXPLORE_CATEGORIES'
  | 'CAR_RENTAL'
  | 'BUY'
  | 'WATCH';

/**
 * Tür başına izinli ve yasak CTA tablosu (REQ-LST-001 kabulü). Yasak listedeki eylem o türün sayfasında
 * hiçbir koşulda gösterilmez; platform içi satın alma/rezervasyon kapsam dışıdır (§7.4).
 */
export const CTA_RULES: Record<ListingKind, { allowed: CtaType[]; forbidden: CtaType[] }> = {
  PLACE: {
    allowed: ['DIRECTIONS', 'CALL', 'RESERVATION', 'WEBSITE'],
    forbidden: ['BUY', 'TICKETS', 'CAR_RENTAL', 'PROVIDER_PRICES', 'SELLER'],
  },
  LODGING: {
    allowed: ['PROVIDER_PRICES', 'WEBSITE', 'CALL', 'DIRECTIONS'],
    forbidden: ['BUY', 'TICKETS', 'CAR_RENTAL', 'SELLER'],
  },
  SERVICE_PROVIDER: {
    allowed: ['CALL', 'APPOINTMENT', 'WEBSITE', 'PROVIDER_PRICES', 'DIRECTIONS'],
    forbidden: ['BUY', 'TICKETS', 'SELLER'],
  },
  GUIDE_PERSON: {
    allowed: ['CONTACT', 'RESERVATION'],
    forbidden: ['BUY', 'TICKETS', 'CAR_RENTAL', 'SELLER', 'PROVIDER_PRICES'],
  },
  EXPERIENCE: {
    allowed: ['PROVIDER_DATES', 'CONTACT', 'WEBSITE'],
    forbidden: ['BUY', 'CAR_RENTAL', 'SELLER'],
  },
  PRODUCT: {
    allowed: ['SELLER', 'OFFICIAL_SITE'],
    forbidden: ['DIRECTIONS', 'CALL', 'RESERVATION', 'CAR_RENTAL', 'TICKETS', 'PROVIDER_PRICES'],
  },
  EVENT: {
    allowed: ['TICKETS', 'WEBSITE', 'DIRECTIONS'],
    forbidden: ['BUY', 'CAR_RENTAL', 'SELLER', 'PROVIDER_PRICES'],
  },
  DESTINATION: {
    allowed: ['READ_GUIDE', 'EXPLORE_CATEGORIES'],
    forbidden: ['BUY', 'TICKETS', 'CAR_RENTAL', 'SELLER', 'RESERVATION', 'PROVIDER_PRICES'],
  },
  POI: {
    allowed: ['DIRECTIONS', 'OFFICIAL_SITE'],
    forbidden: ['BUY', 'TICKETS', 'CAR_RENTAL', 'SELLER', 'PROVIDER_PRICES'],
  },
  WORK: {
    allowed: ['WATCH'],
    forbidden: ['DIRECTIONS', 'CALL', 'RESERVATION', 'CAR_RENTAL', 'PROVIDER_PRICES', 'TICKETS'],
  },
};

export interface CtaContext {
  kind: ListingKind;
  status: string;
  hasCoordinates: boolean;
  phone?: string | null;
  website?: string | null;
  reservationUrl?: string | null;
  /** Etkinlik bitti mi (bitmiş etkinlikte bilet CTA'sı yok). */
  ended?: boolean;
  /** Etkin dış bağlantısı kayıtlı eylemler (affiliate/rezervasyon sağlayıcısı vb. — REQ-AFF-001). */
  linked?: readonly CtaType[];
}

/**
 * Sayfada gösterilecek CTA'lar: türün izinli listesi ∩ verisi olan eylemler. Kapalı/arşiv durumda hiç CTA
 * yok (REQ-LST-006). Dış sağlayıcı gerektiren eylemler (fiyat, tarih, satıcı, bilet) entegrasyon
 * sağlanana kadar gösterilmez (AK-06).
 */
export function ctasFor(c: CtaContext): CtaType[] {
  if (c.status !== 'PUBLISHED') return [];
  const available: Partial<Record<CtaType, boolean>> = {
    DIRECTIONS: c.hasCoordinates,
    CALL: !!c.phone,
    WEBSITE: !!c.website,
    OFFICIAL_SITE: !!c.website,
    RESERVATION: !!c.reservationUrl,
    CONTACT: !!c.phone,
    APPOINTMENT: !!c.reservationUrl,
  };
  for (const t of c.linked ?? []) if (!(c.ended && t === 'TICKETS')) available[t] = true;
  const rules = CTA_RULES[c.kind];
  const out = rules.allowed.filter((t) => available[t] && !rules.forbidden.includes(t));
  // Aynı bağlantıya giden iki eylem gösterilmez (WEBSITE ve OFFICIAL_SITE).
  return out.includes('OFFICIAL_SITE') ? out.filter((t) => t !== 'WEBSITE') : out;
}
