/**
 * URL şemasının tek kaynağı (Ek A15.1, REQ-SEO-003): web sayfaları, site haritası, iç bağlantılar ve
 * mobil derin bağlantılar bu modülü kullanır. Küçük harf, tire ayracı, sonda eğik çizgi yok.
 */
export type ListingKind =
  | 'PLACE'
  | 'LODGING'
  | 'PRODUCT'
  | 'SERVICE_PROVIDER'
  | 'GUIDE_PERSON'
  | 'EXPERIENCE'
  | 'POI'
  | 'DESTINATION'
  | 'EVENT'
  | 'WORK';

/** Tür → yol öneki. Araç kiralama firması hizmet işletmesinin özel önekidir. */
export const LISTING_PREFIX: Record<ListingKind, string> = {
  PLACE: 'mekan',
  LODGING: 'konaklama',
  PRODUCT: 'urun',
  SERVICE_PROVIDER: 'isletme',
  GUIDE_PERSON: 'turist-rehberi',
  EXPERIENCE: 'tur',
  POI: 'yer',
  DESTINATION: 'destinasyon',
  EVENT: 'etkinlik',
  WORK: 'eser',
};
export const CAR_RENTAL_PREFIX = 'arac-kiralama';

const PREFIX_TO_KIND = new Map<string, ListingKind>(
  (Object.entries(LISTING_PREFIX) as Array<[ListingKind, string]>).map(([k, p]) => [p, k]),
);

export interface ListingRef {
  kind: ListingKind;
  slug: string;
  /** Araç kiralama kategorisindeki hizmet işletmesi */
  carRental?: boolean;
}

export function listingPath(ref: ListingRef): string {
  const prefix =
    ref.kind === 'SERVICE_PROVIDER' && ref.carRental ? CAR_RENTAL_PREFIX : LISTING_PREFIX[ref.kind];
  return `/${prefix}/${ref.slug}`;
}

/** Yolu listeleme referansına çözer; listeleme yolu değilse `null`. */
export function parseListingPath(
  path: string,
): { kind: ListingKind; slug: string; carRental: boolean } | null {
  const m = /^\/([a-z-]+)\/([^/]+)$/.exec(path);
  if (!m) return null;
  const [, prefix, slug] = m as unknown as [string, string, string];
  if (prefix === CAR_RENTAL_PREFIX) return { kind: 'SERVICE_PROVIDER', slug, carRental: true };
  const kind = PREFIX_TO_KIND.get(prefix);
  return kind ? { kind, slug, carRental: false } : null;
}

export const LISTING_PREFIXES = [...PREFIX_TO_KIND.keys(), CAR_RENTAL_PREFIX];

/**
 * Yol normalleştirme (REQ-SEO-003): küçük harf, sonda eğik çizgi yok, ardışık eğik çizgi tekil.
 * Değişiklik gerekiyorsa normal biçimi, gerekmiyorsa `null` döner (301 için).
 */
export function normalizePath(path: string): string | null {
  let p = path.replace(/\/{2,}/g, '/');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  p = p.toLowerCase();
  return p === path ? null : p;
}

export const STATIC_PATHS = {
  home: '/',
  search: '/ara',
  login: '/giris',
  register: '/kayit',
  account: '/hesabim',
  terms: '/kullanim-kosullari',
  privacy: '/kvkk-aydinlatma-metni',
  sitemap: '/sitemap.xml',
} as const;

/** Mutlak URL (canonical, site haritası, JSON-LD). */
export function absoluteUrl(base: string, path: string): string {
  return new URL(path, base.endsWith('/') ? base : `${base}/`)
    .toString()
    .replace(/\/$/, path === '/' ? '/' : '');
}
