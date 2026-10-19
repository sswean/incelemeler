import { lowerTr } from './turkish.js';

/**
 * Özel adlara kesme işaretiyle hâl eki (REQ-YRL-002): bulunma ("İzmir'de", "Kars'ta"),
 * yönelme ("Antalya'ya", "İzmir'e"), ilgi ("Muğla'nın", "Bodrum'un").
 * Ünlü uyumu son ünlüye, ünsüz benzeşmesi son sese göre. Özel adlarda yazımda ünsüz yumuşaması yapılmaz
 * ("Ürgüp'e"). Kısaltma ya da sıfırla biten sayı gibi okunuşu belirsiz adlarda `null` döner;
 * çağıran ek gerektirmeyen kalıba düşer.
 */
export type Case = 'locative' | 'dative' | 'genitive';

const BACK = new Set(['a', 'ı', 'o', 'u']);
const VOWELS = new Set(['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü', 'â', 'î', 'û']);
const VOICELESS = new Set(['f', 's', 't', 'k', 'ç', 'ş', 'h', 'p']);

/** Rakamın okunuşu (son ses ve son ünlü için). */
const DIGIT_WORDS: Record<string, string> = {
  '1': 'bir',
  '2': 'iki',
  '3': 'üç',
  '4': 'dört',
  '5': 'beş',
  '6': 'altı',
  '7': 'yedi',
  '8': 'sekiz',
  '9': 'dokuz',
};

function normalizeVowel(ch: string): string {
  return ch === 'â' ? 'a' : ch === 'î' ? 'i' : ch === 'û' ? 'u' : ch;
}

/** Ekin hesaplanacağı "okunuş" (son kelime; sayılarda son rakamın okunuşu). */
function spoken(name: string): string | null {
  const last = name.trim().split(/\s+/).at(-1) ?? '';
  if (!last) return null;
  if (/\d$/.test(last)) {
    const d = last.at(-1)!;
    return d === '0' ? null : DIGIT_WORDS[d]!;
  }
  const letters = last.replace(/[^\p{L}]/gu, '');
  if (
    letters.length >= 2 &&
    letters === letters.toLocaleUpperCase('tr-TR') &&
    /\p{Lu}/u.test(letters)
  ) {
    return null; // kısaltma (ör. "TBMM") — okunuşu belirsiz
  }
  return lowerTr(letters);
}

export function withCase(name: string, kase: Case): string | null {
  const word = spoken(name);
  if (!word) return null;
  const chars = [...word];
  const lastVowel = [...chars].reverse().find((c) => VOWELS.has(c));
  if (!lastVowel) return null;
  const v = normalizeVowel(lastVowel);
  const back = BACK.has(v);
  const endsWithVowel = VOWELS.has(chars.at(-1)!);
  const two = back ? 'a' : 'e';
  const four =
    v === 'a' || v === 'ı'
      ? 'ı'
      : v === 'e' || v === 'i'
        ? 'i'
        : v === 'o' || v === 'u'
          ? 'u'
          : 'ü';
  let suffix: string;
  switch (kase) {
    case 'locative':
      suffix = (VOICELESS.has(chars.at(-1)!) ? 't' : 'd') + two;
      break;
    case 'dative':
      suffix = (endsWithVowel ? 'y' : '') + two;
      break;
    case 'genitive':
      suffix = endsWithVowel ? `n${four}n` : `${four}n`;
      break;
  }
  return `${name.trim()}'${suffix}`;
}
