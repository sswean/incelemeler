import { type AttributeDefinition, IMPORT_FIELDS, type ImportField } from '@incelemeler/contracts';
import { normalizeTr } from '@incelemeler/utils';

/** Başlık eş anlamlıları (katlanmış, küçük harf) → alan. */
const ALIASES: Record<string, ImportField> = {
  ad: 'name',
  isim: 'name',
  name: 'name',
  'kisa tanitim': 'shortDescription',
  shortdescription: 'shortDescription',
  il: 'province',
  sehir: 'province',
  province: 'province',
  ilce: 'district',
  district: 'district',
  mahalle: 'neighborhood',
  neighborhood: 'neighborhood',
  adres: 'addressLine',
  address: 'addressLine',
  addressline: 'addressLine',
  'posta kodu': 'postalCode',
  postalcode: 'postalCode',
  enlem: 'latitude',
  latitude: 'latitude',
  lat: 'latitude',
  boylam: 'longitude',
  longitude: 'longitude',
  lng: 'longitude',
  lon: 'longitude',
  telefon: 'phone',
  phone: 'phone',
  web: 'website',
  'web sitesi': 'website',
  website: 'website',
  'e posta': 'email',
  eposta: 'email',
  email: 'email',
  rezervasyon: 'reservationUrl',
  reservationurl: 'reservationUrl',
  'fiyat seviyesi': 'priceLevel',
  pricelevel: 'priceLevel',
  marka: 'brand',
  brand: 'brand',
  model: 'model',
  gtin: 'gtin',
  barkod: 'gtin',
  'turizm belge no': 'tourismLicenseNo',
  tourismlicenseno: 'tourismLicenseNo',
};

/**
 * Başlıkları alanlara eşler (REQ-LST-007). Açık eşleme (`mapping`) önceliklidir; `attr.<anahtar>`
 * başlıkları kategori özelliklerine gider. Tanınmayan başlıklar raporda listelenir, içe aktarılmaz.
 */
export function mapHeaders(
  header: string[],
  explicit: Record<string, string> = {},
  attributeKeys: ReadonlySet<string>,
): { mapping: Record<string, string>; unmapped: string[] } {
  const mapping: Record<string, string> = {};
  const unmapped: string[] = [];
  for (const h of header) {
    const target = explicit[h] ?? autoTarget(h, attributeKeys);
    const valid =
      target &&
      ((IMPORT_FIELDS as readonly string[]).includes(target) ||
        (target.startsWith('attr.') && attributeKeys.has(target.slice(5))));
    if (valid && !Object.values(mapping).includes(target)) mapping[h] = target;
    else unmapped.push(h);
  }
  return { mapping, unmapped };
}

function autoTarget(h: string, attributeKeys: ReadonlySet<string>): string | undefined {
  if (h.startsWith('attr.') && attributeKeys.has(h.slice(5))) return h;
  return ALIASES[normalizeTr(h).folded];
}

export interface RowError {
  field: string;
  code: string;
}

/** Ondalık virgülü kabul eden sayı (Türkçe dışa aktarımlar). */
export function parseNumber(v: string): number | null {
  const t = v.trim().replace(/\s/g, '');
  if (!t) return null;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) ? n : Number.NaN;
}

const TRUE = new Set(['evet', 'var', 'true', '1', 'e', 'yes']);
const FALSE = new Set(['hayir', 'yok', 'false', '0', 'h', 'no']);

/** Metin hücresini özellik tipine çevirir; çevrilemezse `undefined` + hata. */
export function coerceAttribute(
  def: Pick<AttributeDefinition, 'key' | 'type' | 'options'>,
  raw: string,
): { value?: unknown; error?: RowError } {
  const v = raw.trim();
  if (!v) return {};
  const field = `attr.${def.key}`;
  const option = (s: string) => {
    const f = normalizeTr(s).folded;
    return def.options.find((o) => o.value === s.trim() || normalizeTr(o.label).folded === f)
      ?.value;
  };
  switch (def.type) {
    case 'BOOL': {
      const f = normalizeTr(v).folded;
      if (TRUE.has(f)) return { value: true };
      if (FALSE.has(f)) return { value: false };
      return { error: { field, code: 'attribute_invalid' } };
    }
    case 'INT':
    case 'DECIMAL': {
      const n = parseNumber(v);
      if (n === null || Number.isNaN(n) || (def.type === 'INT' && !Number.isInteger(n))) {
        return { error: { field, code: 'attribute_invalid' } };
      }
      return { value: n };
    }
    case 'ENUM': {
      const o = option(v);
      return o ? { value: o } : { error: { field, code: 'attribute_invalid' } };
    }
    case 'MULTI_ENUM': {
      const parts = v
        .split('|')
        .map((p) => p.trim())
        .filter(Boolean);
      const values = parts.map(option);
      if (values.some((x) => !x)) return { error: { field, code: 'attribute_invalid' } };
      return { value: [...new Set(values)] };
    }
    default:
      return { value: v };
  }
}

/** İki koordinat arası yaklaşık mesafe (metre, haversine). */
export function distanceMeters(a: [number, number], b: [number, number]): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
