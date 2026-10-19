import { normalizeTr } from '@incelemeler/utils';

/**
 * Kural ve sözlük tabanlı sorgu ayrıştırıcı (Ek A7.1): yer adı sözlüğü, kategori terimleri,
 * niyet/özellik eşlemesi ve eş anlamlılar. Tüm karşılaştırmalar aksan katlanmış (folded) biçimde.
 * Saf işlev — sözlük veritabanından yüklenir (SearchLexiconService), testlerde elle verilir.
 */

export interface IntentFilter {
  priceLevelMax?: number;
  attributes?: Record<string, string | boolean>;
}

export interface LexiconPlace {
  id: string;
  level: 'PROVINCE' | 'DISTRICT';
  provinceId: string;
  name: string;
  /** Katlanmış ifadeler (ad + takma adlar). */
  terms: string[];
  /** Yazım hatası toleransı (iller ve takma adlar; ilçe adları yaygın kelimelerle çakışabilir). */
  fuzzy: boolean;
}
export interface LexiconCategory {
  id: string;
  slug: string;
  name: string;
  terms: string[];
}
export interface LexiconIntent {
  id: string;
  label: string;
  terms: string[];
  filter: IntentFilter;
}
export interface Lexicon {
  places: LexiconPlace[];
  categories: LexiconCategory[];
  intents: LexiconIntent[];
  /** Katlanmış ifade → katlanmış ifade (eşleştirmeden önce yeniden yazılır). */
  synonyms: Array<{ term: string; replacement: string }>;
  /** Anlamı filtreye çevrilmeyen dolgu ifadeleri ("iyi", "hafta sonu gidilebilecek"…). */
  stopPhrases: string[];
}

export interface ParsedQuery {
  place:
    (Pick<LexiconPlace, 'id' | 'level' | 'provinceId' | 'name'> & { corrected: boolean }) | null;
  category: Pick<LexiconCategory, 'id' | 'slug' | 'name'> | null;
  intents: Array<Pick<LexiconIntent, 'id' | 'label' | 'filter'>>;
  /** Filtreye çevrilmeyen, tam metin aramaya giden katlanmış kelimeler. */
  text: string[];
  /** Yazım düzeltmesi yapıldıysa önerilen sorgu ("Bunu mu demek istediniz?"). */
  didYouMean: string | null;
}

const MAX_PHRASE = 4;
/** Ekli yazımlar ("antalyada", "otellerde"): terim kelimesine eklenebilecek en uzun ek. */
const MAX_SUFFIX = 5;

/** Kısıtlı Damerau–Levenshtein (bitişik harf yer değiştirmesi 1 işlem: "kapadoyka" → "kapadokya"). */
export function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i]![j] = Math.min(d[i]![j]!, d[i - 2]![j - 2]! + 1);
      }
    }
  }
  return d[a.length]![b.length]!;
}

function allowedTypos(word: string): number {
  return word.length >= 8 ? 2 : word.length >= 5 ? 1 : 0;
}

type Match = 'exact' | 'suffix' | 'fuzzy';

/** Tek kelime eşleşmesi: tam, ek almış (son kelimede) ya da (yalnızca yer adlarında) yazım hatalı. */
function wordMatch(word: string, term: string, last: boolean, fuzzy: boolean): Match | null {
  if (word === term) return 'exact';
  if (
    last &&
    term.length >= 4 &&
    word.startsWith(term) &&
    word.length - term.length <= MAX_SUFFIX
  ) {
    return 'suffix';
  }
  if (fuzzy) {
    const allowed = allowedTypos(term);
    if (allowed > 0 && Math.abs(word.length - term.length) <= allowed) {
      if (editDistance(word, term) <= allowed) return 'fuzzy';
    }
  }
  return null;
}

/** tokens[i..] ile ifade eşleşirse tüketilen kelime sayısı ve eşleşme türü. */
function phraseMatch(
  tokens: string[],
  i: number,
  phrase: string[],
  fuzzy: boolean,
): { len: number; kind: Match } | null {
  if (i + phrase.length > tokens.length) return null;
  let kind: Match = 'exact';
  for (let k = 0; k < phrase.length; k++) {
    const m = wordMatch(tokens[i + k]!, phrase[k]!, k === phrase.length - 1, fuzzy);
    if (!m) return null;
    if (m === 'fuzzy') kind = 'fuzzy';
    else if (m === 'suffix' && kind === 'exact') kind = 'suffix';
  }
  return { len: phrase.length, kind };
}

function applySynonyms(tokens: string[], synonyms: Lexicon['synonyms']): string[] {
  const rules = synonyms
    .map((s) => ({ from: s.term.split(' '), to: s.replacement.split(' ') }))
    .sort((a, b) => b.from.length - a.from.length);
  const out: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const rule = rules.find((r) => phraseMatch(tokens, i, r.from, false)?.kind === 'exact');
    if (rule && phraseMatch(tokens, i, rule.to, false)?.kind === 'exact') {
      // Hedef ifade zaten yazılmış ("kahvalti" → "kahvalti mekanlari"): olduğu gibi bırak.
      out.push(...rule.to);
      i += rule.to.length;
    } else if (rule) {
      out.push(...rule.to);
      i += rule.from.length;
    } else {
      out.push(tokens[i]!);
      i++;
    }
  }
  return out;
}

type Candidate =
  | { type: 'place'; entry: LexiconPlace }
  | { type: 'category'; entry: LexiconCategory }
  | { type: 'intent'; entry: LexiconIntent }
  | { type: 'stop'; entry: null };

const PRIORITY: Record<Candidate['type'], number> = { place: 3, category: 2, intent: 1, stop: 0 };

export function parseQuery(raw: string, lex: Lexicon): ParsedQuery {
  // Zincirleme eş anlamlılar ("kahvaltici" → "kahvalti" → "kahvalti mekanlari"); en fazla 3 tur.
  let tokens = normalizeTr(raw).folded.split(' ').filter(Boolean);
  for (let pass = 0; pass < 3; pass++) {
    const next = applySynonyms(tokens, lex.synonyms);
    if (next.join(' ') === tokens.join(' ')) break;
    tokens = next;
  }
  const dictionary: Array<{ phrase: string[]; cand: Candidate }> = [
    ...lex.places.flatMap((entry) =>
      entry.terms.map((t) => ({
        phrase: t.split(' '),
        cand: { type: 'place', entry } as Candidate,
      })),
    ),
    ...lex.categories.flatMap((entry) =>
      entry.terms.map((t) => ({
        phrase: t.split(' '),
        cand: { type: 'category', entry } as Candidate,
      })),
    ),
    ...lex.intents.flatMap((entry) =>
      entry.terms.map((t) => ({
        phrase: t.split(' '),
        cand: { type: 'intent', entry } as Candidate,
      })),
    ),
    ...lex.stopPhrases.map((t) => ({
      phrase: t.split(' '),
      cand: { type: 'stop', entry: null } as Candidate,
    })),
  ].filter((d) => d.phrase.length <= MAX_PHRASE);

  const result: ParsedQuery = {
    place: null,
    category: null,
    intents: [],
    text: [],
    didYouMean: null,
  };
  const corrected = [...tokens];
  let correctedAny = false;
  let i = 0;
  while (i < tokens.length) {
    let best: { len: number; kind: Match; cand: Candidate; phrase: string[] } | null = null;
    for (const d of dictionary) {
      const m = phraseMatch(tokens, i, d.phrase, d.cand.type === 'place' && d.cand.entry.fuzzy);
      if (!m) continue;
      const better =
        !best ||
        m.len > best.len ||
        (m.len === best.len && rank(m.kind) > rank(best.kind)) ||
        (m.len === best.len &&
          m.kind === best.kind &&
          PRIORITY[d.cand.type] > PRIORITY[best.cand.type]);
      if (better) best = { ...m, cand: d.cand, phrase: d.phrase };
    }
    if (!best) {
      result.text.push(tokens[i]!);
      i++;
      continue;
    }
    const c = best.cand;
    if (c.type === 'place' && !result.place) {
      result.place = {
        id: c.entry.id,
        level: c.entry.level,
        provinceId: c.entry.provinceId,
        name: c.entry.name,
        corrected: best.kind === 'fuzzy',
      };
      if (best.kind === 'fuzzy') {
        corrected.splice(i, best.len, ...best.phrase);
        correctedAny = true;
      }
    } else if (c.type === 'category' && !result.category) {
      result.category = { id: c.entry.id, slug: c.entry.slug, name: c.entry.name };
    } else if (c.type === 'intent') {
      if (!result.intents.some((x) => x.id === c.entry.id)) {
        result.intents.push({ id: c.entry.id, label: c.entry.label, filter: c.entry.filter });
      }
    } else if (c.type !== 'stop') {
      // İkinci yer/kategori: filtreye çevrilmez, metin aramasına kalır.
      result.text.push(...tokens.slice(i, i + best.len));
    }
    i += best.len;
  }
  if (correctedAny) result.didYouMean = corrected.join(' ');
  return result;
}

function rank(kind: Match): number {
  return kind === 'exact' ? 2 : kind === 'suffix' ? 1 : 0;
}

/** Niyet filtrelerini birleştirir (en kısıtlayıcı fiyat). */
export function mergeIntentFilters(intents: ParsedQuery['intents']): IntentFilter {
  const out: IntentFilter = {};
  for (const { filter } of intents) {
    if (filter.priceLevelMax !== undefined) {
      out.priceLevelMax = Math.min(out.priceLevelMax ?? 4, filter.priceLevelMax);
    }
    if (filter.attributes) out.attributes = { ...out.attributes, ...filter.attributes };
  }
  return out;
}
