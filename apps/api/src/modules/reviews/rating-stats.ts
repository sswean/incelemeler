import type { ListingKind, RatingSummary } from '@incelemeler/contracts';
import {
  bayesianAverage,
  DEFAULT_BAYES_C,
  MIN_REVIEWS_FOR_DISTRIBUTION,
  ratingDisplay,
} from '@incelemeler/utils';

/**
 * Türetilmiş puan istatistiği (REQ-VER-007, Ek A6.1–A6.2). Yalnızca kullanıcı puanı; editör puanı bu modüle
 * hiç girmez (REQ-VER-004). Ortalamaya giren: yayımlanmış ve teşvik beyanı olmayan değerlendirmeler.
 */
export interface EligibleReview {
  rating: number;
  criteria: Array<{ criterionId: string; rating: number }>;
  publishedAt: Date;
}

export interface ComputedStats {
  count: number;
  sum: number;
  average: number | null;
  distribution: [number, number, number, number, number];
  criteria: Array<{ criterionId: string; name: string; average: number; count: number }>;
  last12Count: number;
  last12Avg: number | null;
  bayes: number;
  prior: number;
}

/** Hiç değerlendirme yokken öncül: ölçeğin orta noktası (A-019). */
export const NEUTRAL_PRIOR = 3;
/** Grup ortalamasının öncül olarak kullanılması için gereken asgari değerlendirme (A6.2). */
export const MIN_GROUP_FOR_PRIOR = 30;
/** Son 12 ay satırı gösterilen türler (A6.2). */
const LAST12_KINDS: ListingKind[] = ['PLACE', 'LODGING', 'SERVICE_PROVIDER'];

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeStats(
  reviews: EligibleReview[],
  prior: number,
  criterionNames: Map<string, string>,
  now = new Date(),
  c = DEFAULT_BAYES_C,
): ComputedStats {
  const count = reviews.length;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  const distribution: ComputedStats['distribution'] = [0, 0, 0, 0, 0];
  for (const r of reviews) distribution[r.rating - 1]!++;
  const byCriterion = new Map<string, number[]>();
  for (const r of reviews) {
    for (const cr of r.criteria) {
      if (!criterionNames.has(cr.criterionId)) continue;
      byCriterion.set(cr.criterionId, [...(byCriterion.get(cr.criterionId) ?? []), cr.rating]);
    }
  }
  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const recent = reviews.filter((r) => r.publishedAt >= yearAgo);
  return {
    count,
    sum,
    average: count ? round2(sum / count) : null,
    distribution,
    criteria: [...byCriterion.entries()].map(([id, values]) => ({
      criterionId: id,
      name: criterionNames.get(id)!,
      average: round2(values.reduce((a, b) => a + b, 0) / values.length),
      count: values.length,
    })),
    last12Count: recent.length,
    last12Avg: recent.length
      ? round2(recent.reduce((s, r) => s + r.rating, 0) / recent.length)
      : null,
    bayes: Math.round(bayesianAverage(sum, count, prior, c) * 1000) / 1000,
    prior,
  };
}

/**
 * Öncül (m): grup ortalaması (≥ 30 değerlendirme) → üst kategorinin ülke geneli ortalaması → platform ortalaması
 * → ölçek ortası. Gruplar çağıran tarafta hesaplanır.
 */
export function choosePrior(
  group: { count: number; sum: number },
  parent: { count: number; sum: number },
  platform: { count: number; sum: number },
): number {
  if (group.count >= MIN_GROUP_FOR_PRIOR) return round2(group.sum / group.count);
  if (parent.count > 0) return round2(parent.sum / parent.count);
  if (platform.count > 0) return round2(platform.sum / platform.count);
  return NEUTRAL_PRIOR;
}

/** Gösterim eşikleri uygulanmış özet: n < 3 ortalama yok, n ≥ 5 dağılım ve kriterler (A6.2). */
export function toSummary(
  s: Pick<
    ComputedStats,
    'count' | 'average' | 'distribution' | 'criteria' | 'last12Count' | 'last12Avg'
  > | null,
  kind: ListingKind,
): RatingSummary {
  if (!s || s.count === 0) {
    return {
      count: 0,
      display: 'none',
      average: null,
      distribution: null,
      criteria: null,
      last12: null,
    };
  }
  const d = ratingDisplay(s.count, s.average);
  if (d.kind !== 'average') {
    return {
      count: s.count,
      display: 'insufficient',
      average: null,
      distribution: null,
      criteria: null,
      last12: null,
    };
  }
  const full = s.count >= MIN_REVIEWS_FOR_DISTRIBUTION;
  return {
    count: s.count,
    display: 'average',
    average: Math.round(d.average * 10) / 10,
    distribution: full ? [...s.distribution] : null,
    criteria: full
      ? s.criteria
          .filter((c) => c.count >= MIN_REVIEWS_FOR_DISTRIBUTION)
          .map((c) => ({ name: c.name, average: Math.round(c.average * 10) / 10, count: c.count }))
      : null,
    last12:
      LAST12_KINDS.includes(kind) &&
      s.last12Count >= MIN_REVIEWS_FOR_DISTRIBUTION &&
      s.last12Avg !== null
        ? { count: s.last12Count, average: Math.round(s.last12Avg * 10) / 10 }
        : null,
  };
}
