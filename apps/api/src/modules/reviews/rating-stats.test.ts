import { describe, expect, it } from 'vitest';
import {
  choosePrior,
  computeStats,
  NEUTRAL_PRIOR,
  toSummary,
  type EligibleReview,
} from './rating-stats.js';

const now = new Date('2026-10-19T12:00:00Z');
const names = new Map([
  ['c-lezzet', 'Lezzet'],
  ['c-servis', 'Servis'],
]);
function reviews(ratings: number[], monthsAgo = 1): EligibleReview[] {
  return ratings.map((rating, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - monthsAgo - (i % 2));
    return { rating, criteria: [{ criterionId: 'c-lezzet', rating }], publishedAt: d };
  });
}

describe('[REQ-DEG-001] [REQ-VER-007] puan istatistiği ve gösterim eşikleri', () => {
  it.each([
    [0, 'none', null],
    [1, 'insufficient', null],
    [2, 'insufficient', null],
    [3, 'average', 4],
    [5, 'average', 4.2],
    [12, 'average', 4.1],
  ] as const)('n = %i → %s', (n, display, average) => {
    const ratings = [4, 4, 4, 5, 4, 3, 5, 4, 4, 5, 4, 3].slice(0, n);
    const s = computeStats(reviews(ratings), 4, names, now);
    const summary = toSummary(s, 'PLACE');
    expect(summary.display).toBe(display);
    expect(summary.count).toBe(n);
    expect(summary.average).toBe(average);
    // Dağılım ve kriterler yalnızca n ≥ 5.
    expect(summary.distribution !== null).toBe(n >= 5);
    expect(summary.criteria !== null).toBe(n >= 5);
    // Son 12 ay satırı n ≥ 5 ve mekan türünde.
    expect(summary.last12 !== null).toBe(n >= 5);
  });

  it('Bayes ortalaması: (C·m + Σ) / (C + n); az değerlendirme öncüle yakın kalır', () => {
    const one = computeStats(reviews([5]), 3.5, names, now);
    expect(one.bayes).toBeCloseTo((10 * 3.5 + 5) / 11, 3);
    const many = computeStats(reviews(Array(40).fill(5)), 3.5, names, now);
    expect(many.bayes).toBeGreaterThan(one.bayes);
    expect(many.distribution).toEqual([0, 0, 0, 0, 40]);
  });

  it('son 12 ay yalnızca son 12 ayın değerlendirmelerini sayar; ürün türünde gösterilmez', () => {
    const old = reviews([1, 1, 1, 1, 1], 14);
    const recent = reviews([5, 5, 5, 5, 5], 1);
    const s = computeStats([...old, ...recent], 3, names, now);
    expect(s).toMatchObject({ count: 10, last12Count: 5, last12Avg: 5 });
    expect(toSummary(s, 'LODGING').last12).toEqual({ count: 5, average: 5 });
    expect(toSummary(s, 'PRODUCT').last12).toBeNull();
  });

  it('öncül seçimi: grup ≥ 30 → grup; değilse üst kategori; yoksa platform; hiç yoksa ölçek ortası', () => {
    expect(choosePrior({ count: 30, sum: 120 }, { count: 5, sum: 15 }, { count: 9, sum: 27 })).toBe(
      4,
    );
    expect(choosePrior({ count: 29, sum: 116 }, { count: 5, sum: 15 }, { count: 9, sum: 27 })).toBe(
      3,
    );
    expect(choosePrior({ count: 0, sum: 0 }, { count: 0, sum: 0 }, { count: 4, sum: 18 })).toBe(
      4.5,
    );
    expect(choosePrior({ count: 0, sum: 0 }, { count: 0, sum: 0 }, { count: 0, sum: 0 })).toBe(
      NEUTRAL_PRIOR,
    );
  });

  it('[REQ-VER-004] istatistik yalnızca kullanıcı puanıyla çalışır (editör puanı girdisi yok)', () => {
    const keys = Object.keys(computeStats(reviews([4, 5, 3]), 4, names, now)).sort();
    expect(keys.some((k) => /editor|verdict|overall/i.test(k))).toBe(false);
  });
});
