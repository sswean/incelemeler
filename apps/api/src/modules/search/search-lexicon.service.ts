import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { normalizeTr } from '@incelemeler/utils';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Lexicon } from './query-parser.js';

const fold = (s: string) => normalizeTr(s).folded;
const TTL_MS = 60_000;

/** Niyet filtresi şeması (panelden girilen JSON doğrulanır). */
export const IntentFilterSchema = z
  .object({
    priceLevelMax: z.number().int().min(1).max(4).optional(),
    attributes: z.record(z.string(), z.union([z.string(), z.boolean()])).optional(),
  })
  .strict();

/** Filtreye çevrilmeyen dolgu ifadeleri (Ek A7.1 örneklerinden). */
export const STOP_PHRASES = [
  'iyi',
  'en iyi',
  'guzel',
  'icin',
  'ile',
  've',
  'de',
  'da',
  'gidilebilecek',
  'gidilecek',
  'hafta sonu',
  'gunluk',
  'yerler',
  'yerleri',
  'mekanlari',
  'mekanlar',
  'onerileri',
  'nerede',
];

/** Çoğul eki atılmış tekil biçim ("oteller" → "otel"); ek uyumu için ayrıştırıcı sonek toleransı kullanır. */
function singular(word: string): string | null {
  const m = /^(.{3,})(ler|lar)$/.exec(word);
  return m ? m[1]! : null;
}

/**
 * Sorgu ayrıştırıcının sözlüğü (Ek A7.1): iller (yazım toleranslı), ülke genelinde adı benzersiz ilçeler,
 * takma adlar, yayındaki kategoriler, etkin niyetler ve eş anlamlılar. 60 sn bellekte tutulur.
 */
@Injectable()
export class SearchLexiconService {
  private cache: { at: number; lexicon: Lexicon } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  invalidate(): void {
    this.cache = null;
  }

  async get(): Promise<Lexicon> {
    if (this.cache && Date.now() - this.cache.at < TTL_MS) return this.cache.lexicon;
    const lexicon = await this.load();
    this.cache = { at: Date.now(), lexicon };
    return lexicon;
  }

  private async load(): Promise<Lexicon> {
    const [areas, aliases, categories, intents, synonyms] = await Promise.all([
      this.prisma.adminArea.findMany({
        select: { id: true, level: true, name: true, parentId: true },
      }),
      this.prisma.placeAlias.findMany(),
      this.prisma.category.findMany({
        where: { status: 'PUBLISHED' },
        select: { id: true, slug: true, name: true },
      }),
      this.prisma.searchIntent.findMany({ where: { active: true } }),
      this.prisma.searchSynonym.findMany(),
    ]);
    const districtNameCount = new Map<string, number>();
    for (const a of areas) {
      if (a.level === 'DISTRICT') {
        const f = fold(a.name);
        districtNameCount.set(f, (districtNameCount.get(f) ?? 0) + 1);
      }
    }
    const byId = new Map(areas.map((a) => [a.id, a]));
    const places: Lexicon['places'] = [];
    for (const a of areas) {
      const f = fold(a.name);
      const provinceId = a.level === 'PROVINCE' ? a.id : (a.parentId ?? a.id);
      const aliasTerms = aliases.filter((x) => x.adminAreaId === a.id).map((x) => x.aliasFold);
      if (a.level === 'PROVINCE') {
        places.push({
          id: a.id,
          level: 'PROVINCE',
          provinceId,
          name: a.name,
          terms: [f, ...aliasTerms],
          fuzzy: true,
        });
        continue;
      }
      // İlçeler: yalnızca ülke genelinde benzersiz ve ≥ 5 harfli adlar (yaygın kelimelerle çakışmayı önler)
      // ya da açıkça takma adı tanımlanmışsa.
      const unique =
        districtNameCount.get(f) === 1 && f.length >= 5 && !byIdHasProvinceNamed(byId, f);
      const terms = [...(unique ? [f] : []), ...aliasTerms];
      if (terms.length) {
        places.push({
          id: a.id,
          level: 'DISTRICT',
          provinceId,
          name: a.name,
          terms,
          fuzzy: aliasTerms.length > 0 && !unique,
        });
      }
    }
    return {
      places,
      categories: categories.map((c) => {
        const f = fold(c.name);
        const words = f.split(' ');
        const last = words.at(-1)!;
        const sing = singular(last);
        return {
          id: c.id,
          slug: c.slug,
          name: c.name,
          terms: [f, ...(sing ? [[...words.slice(0, -1), sing].join(' ')] : [])],
        };
      }),
      intents: intents.flatMap((i) => {
        const filter = IntentFilterSchema.safeParse(i.filter);
        return filter.success
          ? [{ id: i.key, label: i.label, terms: i.terms.map(fold), filter: filter.data }]
          : [];
      }),
      synonyms: synonyms.map((s) => ({ term: fold(s.term), replacement: fold(s.replacement) })),
      stopPhrases: STOP_PHRASES,
    };
  }
}

function byIdHasProvinceNamed(
  byId: Map<string, { level: string; name: string }>,
  folded: string,
): boolean {
  for (const a of byId.values()) if (a.level === 'PROVINCE' && fold(a.name) === folded) return true;
  return false;
}
