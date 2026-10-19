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

export type ArticleType = 'GUIDE' | 'LIST' | 'COMPARISON' | 'REVIEW' | 'NEWS' | 'SPONSORED';

/** Yazı türü → URL öneki (Ek A15.1; NEWS ve SPONSORED için A-014). */
export const ARTICLE_PREFIX: Record<ArticleType, string> = {
  GUIDE: 'rehber',
  LIST: 'liste',
  COMPARISON: 'karsilastir',
  REVIEW: 'inceleme',
  NEWS: 'haber',
  SPONSORED: 'sponsorlu',
};

export function articlePath(ref: { type: ArticleType; slug: string }): string {
  return `/${ARTICLE_PREFIX[ref.type]}/${ref.slug}`;
}

export function authorPath(slug: string): string {
  return `/yazar/${slug}`;
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
  methodology: '/nasil-degerlendiriyoruz',
  independence: '/editoryal-bagimsizlik',
  sponsoredPolicy: '/sponsorlu-icerik-politikasi',
  corrections: '/duzeltme-politikasi',
} as const;

/** Mutlak URL (canonical, site haritası, JSON-LD). */
export function absoluteUrl(base: string, path: string): string {
  return new URL(path, base.endsWith('/') ? base : `${base}/`)
    .toString()
    .replace(/\/$/, path === '/' ? '/' : '');
}

/**
 * İl/ilçe/kategori slug'ı olamayacak ilk yol bölümleri (Ek A15.1 kuralları): tür önekleri, içerik önekleri,
 * sabit sayfalar ve sistem yolları. Hub'lar `/{il}/…` ile başladığından bu sözcüklerle çakışamaz.
 */
export const RESERVED_SEGMENTS: ReadonlySet<string> = new Set([
  ...Object.values(LISTING_PREFIX),
  CAR_RENTAL_PREFIX,
  ...Object.values(ARTICLE_PREFIX),
  ...Object.values(STATIC_PATHS)
    .map((p) => p.split('/')[1] ?? '')
    .filter(Boolean),
  'ara',
  'onizleme',
  'yazar',
  'medya',
  'sitemaps',
  'sitemap.xml',
  'robots.txt',
  'eposta-dogrula',
  'parola-sifirla',
  'kesfet',
  'firsatlar',
  'marka',
  'urunler',
  'kullanici',
  'git',
  'olay',
  'kosullar',
  'hesap-silme',
  'kaydedilenler',
  'bildirimler',
  'gecmis',
  'isletmeni-ekle',
  'isletmeni-sahiplen',
  'isletme-paneli',
  'reklam-ve-sponsorluk',
  'hakkimizda',
  'iletisim',
  'sss',
  'icerik-politikasi',
  'topluluk-kurallari',
  'gizlilik',
  'cerez-tercihleri',
  'bildir',
  'kvkk-basvuru',
  'kunye',
  'erisilebilirlik',
  'api',
  'favicon.ico',
]);

export interface HubRef {
  province: string;
  district?: string | null;
  category?: string | null;
}

/** Destinasyon ve keşif hub'ları (Ek A15.1): /{il}, /{il}/{ilce}, /{il}/{kategori}, /{il}/{ilce}/{kategori}. */
export function hubPath(h: HubRef): string {
  return `/${[h.province, h.district, h.category].filter(Boolean).join('/')}`;
}
