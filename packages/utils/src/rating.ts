/**
 * Puanlama yardımcıları (Ek A6.1–A6.2, REQ-DEG-001).
 * Editör puanı ve kullanıcı puanı ASLA birleştirilmez; bu modül yalnızca kullanıcı puanıyla çalışır.
 */

export const USER_RATING_MIN = 1;
export const USER_RATING_MAX = 5;
/** Ortalama gösterimi için gereken asgari yayımlanmış değerlendirme sayısı. */
export const MIN_REVIEWS_FOR_AVERAGE = 3;
/** Dağılım ve kriter ortalamaları için asgari sayı. */
export const MIN_REVIEWS_FOR_DISTRIBUTION = 5;
export const DEFAULT_BAYES_C = 10;

/**
 * Bayes ortalaması: (C·m + Σpuan) / (C + n).
 * @param sum yayımlanmış puanların toplamı
 * @param n yayımlanmış değerlendirme sayısı
 * @param prior m — grup ortalaması (öncül)
 * @param c C — öncül ağırlığı (varsayılan 10)
 */
export function bayesianAverage(sum: number, n: number, prior: number, c = DEFAULT_BAYES_C): number {
  if (n < 0 || c < 0) throw new RangeError('n ve C negatif olamaz');
  if (n === 0 && c === 0) throw new RangeError('n ve C aynı anda 0 olamaz');
  return (c * prior + sum) / (c + n);
}

export type RatingDisplay =
  | { kind: 'none' }
  | { kind: 'insufficient'; count: number }
  | { kind: 'average'; count: number; average: number; showDistribution: boolean };

/** Gösterim eşikleri (A6.2). */
export function ratingDisplay(count: number, average: number | null): RatingDisplay {
  if (count <= 0) return { kind: 'none' };
  if (count < MIN_REVIEWS_FOR_AVERAGE || average === null) return { kind: 'insufficient', count };
  return {
    kind: 'average',
    count,
    average,
    showDistribution: count >= MIN_REVIEWS_FOR_DISTRIBUTION,
  };
}

/** Editör puanı: 0–10, 0,5 adımlı. */
export function isValidEditorialScore(score: number): boolean {
  return score >= 0 && score <= 10 && Number.isInteger(score * 2);
}

export function isValidUserRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= USER_RATING_MIN && rating <= USER_RATING_MAX;
}
