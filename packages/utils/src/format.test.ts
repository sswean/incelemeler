import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDistance,
  formatEditorialScore,
  formatLongDate,
  formatMoney,
  formatMonthYear,
  formatRating,
  formatTime,
} from './format.js';

// Intl çıktısında bölünemez boşluklar olabilir; karşılaştırma için normalize edilir.
const n = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');

describe('[REQ-YRL-003] tr-TR biçimleri', () => {
  it('para: 123456 kuruş → ₺1.234,56', () => {
    expect(n(formatMoney(123456))).toBe('₺1.234,56');
  });
  it('para: kuruş tamsayı değilse hata', () => {
    expect(() => formatMoney(12.5)).toThrow(TypeError);
  });
  it('tarih Europe/Istanbul saat dilimiyle GG.AA.YYYY', () => {
    // 2026-10-18T22:30Z İstanbul'da 19 Ekim 01:30'dur.
    const d = new Date('2026-10-18T22:30:00Z');
    expect(formatDate(d)).toBe('19.10.2026');
    expect(formatTime(d)).toBe('01:30');
    expect(formatLongDate(d)).toBe('19 Ekim 2026');
  });
  it('puan virgülle tek ondalık', () => {
    expect(formatRating(4.25)).toBe('4,3');
    expect(formatRating(4)).toBe('4,0');
  });
  it('[REQ-VER-005] editör puanı 10 üzerinden, gerektiğinde tek ondalık; ziyaret ayı', () => {
    expect(formatEditorialScore(8.5)).toBe('8,5/10');
    expect(formatEditorialScore(8)).toBe('8/10');
    expect(formatEditorialScore(0)).toBe('0/10');
    expect(formatMonthYear(new Date('2026-09-12T12:00:00Z'))).toBe('Eylül 2026');
  });
  it('mesafe', () => {
    expect(formatDistance(350)).toBe('350 m');
    expect(formatDistance(1234)).toBe('1,2 km');
  });
});
