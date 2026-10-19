import type { ListingKind, SearchInterpretation, SearchSort } from '@incelemeler/contracts';

/**
 * /ara sayfasının URL durumu (REQ-ARA-012: URL filtre durumunu yansıtır, paylaşılabilir, geri tuşu çalışır).
 * Kullanıcıya görünen parametreler Türkçe; API parametrelerine burada çevrilir.
 */
export interface SearchState {
  q: string;
  il: string | null;
  ilce: string | null;
  kategori: string | null;
  tur: ListingKind | null;
  icerik: 'LISTING' | 'ARTICLE' | null;
  fiyat: number | null;
  puan: '3.5' | '4' | '4.5' | null;
  ozellik: string[];
  sirala: SearchSort;
  sayfa: number;
  /** false: sorgu ayrıştırıcı kapalı (kullanıcı bir yorum çipini kaldırdı). */
  yorumla: boolean;
  enlem: number | null;
  boylam: number | null;
}

type Params = Record<string, string | string[] | undefined>;

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const KINDS: ListingKind[] = [
  'PLACE',
  'LODGING',
  'PRODUCT',
  'SERVICE_PROVIDER',
  'GUIDE_PERSON',
  'EXPERIENCE',
  'POI',
  'DESTINATION',
  'EVENT',
  'WORK',
];
const SORTS: SearchSort[] = ['recommended', 'rating', 'reviews', 'nearest', 'newest'];
const ATTR = /^[a-zA-Z][a-zA-Z0-9_]{0,59}:[a-zA-Z0-9_-]{1,60}$/;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || null;
const many = (v: string | string[] | undefined) =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];
const slug = (v: string | string[] | undefined) => {
  const s = one(v);
  return s && SLUG.test(s) ? s : null;
};
const num = (v: string | string[] | undefined, min: number, max: number) => {
  const n = Number(one(v));
  return one(v) !== null && Number.isFinite(n) && n >= min && n <= max ? n : null;
};

export const EMPTY_STATE: SearchState = {
  q: '',
  il: null,
  ilce: null,
  kategori: null,
  tur: null,
  icerik: null,
  fiyat: null,
  puan: null,
  ozellik: [],
  sirala: 'recommended',
  sayfa: 1,
  yorumla: true,
  enlem: null,
  boylam: null,
};

/** Geçersiz değerler sessizce yok sayılır (kullanıcı URL'yi elle düzenleyebilir). */
export function parseState(p: Params): SearchState {
  const tur = one(p.tur);
  const icerik = one(p.icerik);
  const puan = one(p.puan);
  const sirala = one(p.sirala);
  const fiyat = num(p.fiyat, 1, 4);
  const il = slug(p.il);
  return {
    q: (one(p.q) ?? '').slice(0, 200),
    il,
    ilce: il ? slug(p.ilce) : null,
    kategori: slug(p.kategori),
    tur: tur && (KINDS as string[]).includes(tur) ? (tur as ListingKind) : null,
    icerik: icerik === 'LISTING' || icerik === 'ARTICLE' ? icerik : null,
    fiyat: fiyat !== null && Number.isInteger(fiyat) ? fiyat : null,
    puan: puan === '3.5' || puan === '4' || puan === '4.5' ? puan : null,
    ozellik: [...new Set(many(p.ozellik).filter((a) => ATTR.test(a)))].slice(0, 10),
    sirala: sirala && (SORTS as string[]).includes(sirala) ? (sirala as SearchSort) : 'recommended',
    sayfa: Math.trunc(num(p.sayfa, 1, 50) ?? 1),
    yorumla: one(p.yorumla) !== 'hayir',
    enlem: num(p.enlem, 35, 43),
    boylam: num(p.boylam, 25, 45.5),
  };
}

/** API sorgusu (SearchQuery). */
export function toApiQuery(s: SearchState): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  if (s.q) out.q = s.q;
  if (s.il) out.province = s.il;
  if (s.il && s.ilce) out.district = s.ilce;
  if (s.kategori) out.category = s.kategori;
  if (s.tur) out.kind = s.tur;
  if (s.icerik) out.type = s.icerik;
  if (s.fiyat !== null) out.priceMax = String(s.fiyat);
  if (s.puan) out.minRating = s.puan;
  if (s.ozellik.length) out.attr = s.ozellik;
  if (s.sirala !== 'recommended') out.sort = s.sirala;
  if (s.enlem !== null && s.boylam !== null) {
    out.lat = String(s.enlem);
    out.lng = String(s.boylam);
  }
  if (!s.yorumla) out.interpret = 'false';
  if (s.sayfa > 1) out.page = String(s.sayfa);
  return out;
}

/** Durumdan /ara adresi (varsayılanlar yazılmaz; sayfa değişikliği dışında sayfa 1'e döner). */
export function searchHref(s: SearchState): string {
  const p = new URLSearchParams();
  if (s.q) p.set('q', s.q);
  if (s.il) p.set('il', s.il);
  if (s.il && s.ilce) p.set('ilce', s.ilce);
  if (s.kategori) p.set('kategori', s.kategori);
  if (s.tur) p.set('tur', s.tur);
  if (s.icerik) p.set('icerik', s.icerik);
  if (s.fiyat !== null) p.set('fiyat', String(s.fiyat));
  if (s.puan) p.set('puan', s.puan);
  for (const a of s.ozellik) p.append('ozellik', a);
  if (s.sirala !== 'recommended') p.set('sirala', s.sirala);
  if (s.enlem !== null && s.boylam !== null) {
    p.set('enlem', String(s.enlem));
    p.set('boylam', String(s.boylam));
  }
  if (!s.yorumla) p.set('yorumla', 'hayir');
  if (s.sayfa > 1) p.set('sayfa', String(s.sayfa));
  const qs = p.toString();
  return qs ? `/ara?${qs}` : '/ara';
}

/** Etkin (açık) filtre sayısı — mobil filtre düğmesindeki rozet. */
export function activeFilterCount(s: SearchState): number {
  return (
    [s.il, s.kategori, s.tur, s.icerik, s.fiyat, s.puan].filter((v) => v !== null).length +
    s.ozellik.length
  );
}

export type Chip = { id: string; label: string; href: string };

/**
 * Ayrıştırıcının yorumunu kaldırılabilir çiplere çevirir (Ek A7.1): bir çip kaldırılınca kalan yorum
 * açık parametrelere yazılır, sorgu metni yalnızca yorumlanmayan kısım olur ve ayrıştırma kapanır.
 */
export function interpretationChips(
  s: SearchState,
  i: SearchInterpretation,
  labels: { price: (n: number) => string },
): Chip[] {
  const parts: Array<{ id: string; label: string; apply: (x: SearchState) => SearchState }> = [];
  if (i.place) {
    const place = i.place;
    parts.push({
      id: 'place',
      label: place.name,
      apply: (x) => ({ ...x, il: place.province, ilce: place.district }),
    });
  }
  if (i.category) {
    const category = i.category;
    parts.push({
      id: 'category',
      label: category.name,
      apply: (x) => ({ ...x, kategori: category.slug }),
    });
  }
  for (const intent of i.intents) {
    parts.push({
      id: `intent:${intent.key}`,
      label:
        intent.priceMax !== null && !intent.attrs.length
          ? labels.price(intent.priceMax)
          : intent.label,
      apply: (x) => ({
        ...x,
        fiyat: intent.priceMax !== null ? Math.min(x.fiyat ?? 4, intent.priceMax) : x.fiyat,
        ozellik: [...new Set([...x.ozellik, ...intent.attrs])],
      }),
    });
  }
  return parts.map((chip) => {
    let next: SearchState = { ...s, q: i.text ?? '', yorumla: false, sayfa: 1 };
    for (const other of parts) if (other.id !== chip.id) next = other.apply(next);
    return { id: chip.id, label: chip.label, href: searchHref(next) };
  });
}

/** Açık filtre çipleri: kaldırınca yalnızca o parametre düşer. */
export function explicitChips(
  s: SearchState,
  names: {
    il?: string;
    ilce?: string;
    kategori?: string;
    tur?: string;
    icerik?: string;
    fiyat?: string;
    puan?: string;
    ozellik: (a: string) => string;
  },
): Chip[] {
  const base = { ...s, sayfa: 1 };
  const chips: Chip[] = [];
  if (s.il)
    chips.push({
      id: 'il',
      label: names.il ?? s.il,
      href: searchHref({ ...base, il: null, ilce: null }),
    });
  if (s.il && s.ilce)
    chips.push({
      id: 'ilce',
      label: names.ilce ?? s.ilce,
      href: searchHref({ ...base, ilce: null }),
    });
  if (s.kategori)
    chips.push({
      id: 'kategori',
      label: names.kategori ?? s.kategori,
      href: searchHref({ ...base, kategori: null }),
    });
  if (s.tur)
    chips.push({ id: 'tur', label: names.tur ?? s.tur, href: searchHref({ ...base, tur: null }) });
  if (s.icerik)
    chips.push({
      id: 'icerik',
      label: names.icerik ?? s.icerik,
      href: searchHref({ ...base, icerik: null }),
    });
  if (s.fiyat !== null)
    chips.push({
      id: 'fiyat',
      label: names.fiyat ?? String(s.fiyat),
      href: searchHref({ ...base, fiyat: null }),
    });
  if (s.puan)
    chips.push({
      id: 'puan',
      label: names.puan ?? s.puan,
      href: searchHref({ ...base, puan: null }),
    });
  for (const a of s.ozellik) {
    chips.push({
      id: `ozellik:${a}`,
      label: names.ozellik(a),
      href: searchHref({ ...base, ozellik: s.ozellik.filter((x) => x !== a) }),
    });
  }
  return chips;
}

/** Sıfır sonuç gevşetmesi: API'nin "drop" anahtarına göre yeni adres (REQ-ARA-013). */
export function relaxHref(s: SearchState, i: SearchInterpretation, drop: string): string {
  // Yorumlanan filtreleri açık parametreye yaz, sonra düşür.
  let next: SearchState = { ...s, sayfa: 1 };
  if (s.yorumla) {
    next = { ...next, q: i.text ?? '', yorumla: false };
    if (i.place && !s.il) next = { ...next, il: i.place.province, ilce: i.place.district };
    if (i.category && !s.kategori) next = { ...next, kategori: i.category.slug };
    for (const intent of i.intents) {
      if (intent.priceMax !== null)
        next = { ...next, fiyat: Math.min(next.fiyat ?? 4, intent.priceMax) };
      next = { ...next, ozellik: [...new Set([...next.ozellik, ...intent.attrs])] };
    }
  }
  if (drop === 'place') next = { ...next, il: null, ilce: null };
  else if (drop === 'category') next = { ...next, kategori: null };
  else if (drop === 'priceMax') next = { ...next, fiyat: null };
  else if (drop === 'minRating') next = { ...next, puan: null };
  else if (drop === 'text') next = { ...next, q: '' };
  else if (drop.startsWith('attr:')) {
    const key = drop.slice(5);
    next = { ...next, ozellik: next.ozellik.filter((a) => !a.startsWith(`${key}:`)) };
  }
  return searchHref(next);
}
