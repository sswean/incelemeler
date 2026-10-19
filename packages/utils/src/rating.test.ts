import { describe, expect, it } from 'vitest';
import {
  bayesianAverage,
  isValidEditorialScore,
  isValidUserRating,
  ratingDisplay,
} from './rating.js';

describe('[REQ-DEG-001] gösterim eşikleri', () => {
  it.each([
    [0, null, 'none'],
    [1, 5, 'insufficient'],
    [2, 4.5, 'insufficient'],
    [3, 4, 'average'],
    [5, 4, 'average'],
    [12, 3.8, 'average'],
  ] as const)('n=%i → %s', (n, avg, kind) => {
    expect(ratingDisplay(n, avg).kind).toBe(kind);
  });
  it('dağılım n ≥ 5 iken gösterilir', () => {
    const r3 = ratingDisplay(3, 4);
    const r5 = ratingDisplay(5, 4);
    expect(r3.kind === 'average' && r3.showDistribution).toBe(false);
    expect(r5.kind === 'average' && r5.showDistribution).toBe(true);
  });
});

describe('[REQ-DEG-001] Bayes ortalaması', () => {
  it('az değerlendirmede öncüle yakın kalır', () => {
    // m=4, C=10, tek 5 puan → (40+5)/11
    expect(bayesianAverage(5, 1, 4)).toBeCloseTo(45 / 11, 10);
  });
  it('çok değerlendirmede ham ortalamaya yaklaşır', () => {
    expect(bayesianAverage(4.8 * 1000, 1000, 3)).toBeCloseTo(4.782, 3);
  });
  it('geçersiz girdide hata', () => {
    expect(() => bayesianAverage(0, -1, 4)).toThrow(RangeError);
    expect(() => bayesianAverage(0, 0, 4, 0)).toThrow(RangeError);
  });
});

describe('[REQ-VER-005] [REQ-VER-006] puan doğrulama', () => {
  it('editör puanı 0–10 ve 0,5 adımlı', () => {
    expect(isValidEditorialScore(8.5)).toBe(true);
    expect(isValidEditorialScore(8.3)).toBe(false);
    expect(isValidEditorialScore(10.5)).toBe(false);
  });
  it('kullanıcı puanı 1–5 tam sayı', () => {
    expect(isValidUserRating(5)).toBe(true);
    expect(isValidUserRating(4.5)).toBe(false);
    expect(isValidUserRating(0)).toBe(false);
  });
});
