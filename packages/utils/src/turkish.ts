/**
 * Türkçe metin işleme yardımcıları (REQ-YRL-001, REQ-ARA-003, §4.3).
 * Tüm büyük/küçük harf dönüşümleri tr-TR kurallarıyla yapılır:
 * 'I' → 'ı', 'İ' → 'i'. Varsayılan `toLowerCase()` bu dönüşümleri yanlış yapar.
 */

const LOCALE = 'tr-TR';

/** Türkçe kurallarıyla küçük harfe çevirir. */
export function lowerTr(input: string): string {
  return input.toLocaleLowerCase(LOCALE);
}

/** Türkçe kurallarıyla büyük harfe çevirir. */
export function upperTr(input: string): string {
  return input.toLocaleUpperCase(LOCALE);
}

const FOLD_MAP: Record<string, string> = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
  â: 'a',
  î: 'i',
  û: 'u',
};

/** Küçük harfli Türkçe metindeki aksanlı harfleri ASCII karşılıklarına katlar. */
export function foldTr(lowercased: string): string {
  let out = '';
  for (const ch of lowercased.normalize('NFC')) {
    out += FOLD_MAP[ch] ?? ch;
  }
  // Kalan birleşik işaretleri (ör. ayrık nokta) temizle.
  return out.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Kesme işareti varyantları: ' ’ ‘ ` ´ */
const APOSTROPHES = /['’‘`´]/g;

/**
 * Bir kelimedeki kesme işaretinden sonraki eki atar: "Antalya'da" → "Antalya".
 */
export function stripSuffixAfterApostrophe(word: string): string {
  const idx = word.search(APOSTROPHES);
  return idx === -1 ? word : word.slice(0, idx);
}

export interface NormalizedText {
  /** Türkçe küçük harf, ekler atılmış, noktalama temizlenmiş. */
  tr: string;
  /** Aksanları katlanmış (ASCII) varyant. */
  folded: string;
}

/**
 * Arama normalizasyonu (REQ-ARA-003):
 * 1) Türkçe küçük harf, 2) kesme işaretinden sonraki eki at, 3) aksan katlanmış ikinci varyant.
 */
export function normalizeTr(input: string): NormalizedText {
  const lowered = lowerTr(input.normalize('NFC'));
  const words = lowered
    .split(/\s+/)
    .map((w) => stripSuffixAfterApostrophe(w))
    .map((w) => w.replace(/[^\p{L}\p{N}]+/gu, ' ').trim())
    .filter((w) => w.length > 0);
  const tr = words.join(' ').replace(/\s+/g, ' ').trim();
  return { tr, folded: foldTr(tr) };
}

/**
 * URL slug üretimi (REQ-YRL-001): Türkçe küçük harf → transliterasyon → kesme işaretleri silinir →
 * alfasayısal dışı karakterler tire → çoklu tire tekilleşir.
 * Not: Kesme işaretinden sonraki ek slug'da korunur ("İzmir'in" → "izmirin").
 */
export function slugifyTr(input: string): string {
  const lowered = lowerTr(input.normalize('NFC')).replace(APOSTROPHES, '');
  return foldTr(lowered)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

/** Türkçe alfabetik karşılaştırıcı (Intl.Collator('tr')). */
export const collatorTr = new Intl.Collator('tr', { sensitivity: 'base' });

export function compareTr(a: string, b: string): number {
  return collatorTr.compare(a, b);
}
