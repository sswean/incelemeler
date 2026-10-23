import { describe, expect, it } from 'vitest';
import {
  formatClock,
  isOpenAt,
  localParts,
  parseClock,
  type WeeklyRange,
} from './opening-hours.js';

const TZ = 'Europe/Istanbul';
/** İstanbul yerel saatiyle an (UTC+3, yaz saati yok). */
const at = (local: string) => new Date(`${local}:00+03:00`);
// Bar: Pzt–Cum 18:00–02:00; Cmt 18:00–04:00; Pazar kapalı. 2026-10-19 Pazartesi.
const bar: WeeklyRange[] = [1, 2, 3, 4, 5].map((day) => ({ day, opens: 1080, closes: 120 }));
bar.push({ day: 6, opens: 1080, closes: 240 });

describe('çalışma saatleri (REQ-VER-010)', () => {
  it('[REQ-VER-010] [REQ-TST-004] gece yarısını aşan aralık; saat dilimi sabit (Europe/Istanbul)', () => {
    expect(localParts(at('2026-10-19T23:30'), TZ)).toEqual({
      date: '2026-10-19',
      day: 1,
      minutes: 1410,
    });
    expect(isOpenAt(bar, [], TZ, at('2026-10-19T17:59'))).toBe(false);
    expect(isOpenAt(bar, [], TZ, at('2026-10-19T18:00'))).toBe(true);
    expect(isOpenAt(bar, [], TZ, at('2026-10-19T23:30'))).toBe(true);
    // Salı 01:00: Pazartesi aralığının devamı.
    expect(isOpenAt(bar, [], TZ, at('2026-10-20T01:00'))).toBe(true);
    expect(isOpenAt(bar, [], TZ, at('2026-10-20T02:00'))).toBe(false);
    // Pazar 03:00: Cumartesi 18:00–04:00 devamı; Pazar akşamı kapalı; Pazartesi 01:00 Pazar'dan devam yok.
    expect(isOpenAt(bar, [], TZ, at('2026-10-25T03:00'))).toBe(true);
    expect(isOpenAt(bar, [], TZ, at('2026-10-25T20:00'))).toBe(false);
    expect(isOpenAt(bar, [], TZ, at('2026-10-26T01:00'))).toBe(false);
    // Aynı an başka saat diliminde başka sonuç verir (sunucu saat dilimine bağlı değil).
    expect(isOpenAt(bar, [], 'UTC', at('2026-10-19T18:30'))).toBe(false);
  });

  it('[REQ-VER-010] [REQ-TST-004] istisnalar: bayram kapalı, özel saat; kapalı günden önceki gecenin devamı korunur', () => {
    // 29 Ekim (Perşembe) resmî tatil: kapalı; 30 Ekim (Cuma) özel saat 20:00–23:00.
    const ex = [
      { date: '2026-10-29', closed: true },
      { date: '2026-10-30', closed: false, opens: 1200, closes: 1380 },
    ];
    expect(isOpenAt(bar, ex, TZ, at('2026-10-29T19:00'))).toBe(false);
    // 29 Ekim 01:00: Çarşamba gecesinin devamı açık.
    expect(isOpenAt(bar, ex, TZ, at('2026-10-29T01:00'))).toBe(true);
    // 30 Ekim 01:00: önceki gün kapalı (istisna) → devam yok.
    expect(isOpenAt(bar, ex, TZ, at('2026-10-30T01:00'))).toBe(false);
    expect(isOpenAt(bar, ex, TZ, at('2026-10-30T19:00'))).toBe(false);
    expect(isOpenAt(bar, ex, TZ, at('2026-10-30T21:00'))).toBe(true);
    expect(isOpenAt(bar, ex, TZ, at('2026-10-30T23:30'))).toBe(false);
  });

  it('[REQ-VER-010] saat girilmemişse bilinmiyor; 24 saat; saat ayrıştırma', () => {
    expect(isOpenAt([], [], TZ, at('2026-10-19T12:00'))).toBeNull();
    const allDay = [1, 2, 3, 4, 5, 6, 7].map((day) => ({ day, opens: 0, closes: 1440 }));
    expect(isOpenAt(allDay, [], TZ, at('2026-10-19T23:59'))).toBe(true);
    expect(parseClock('18:00')).toBe(1080);
    expect(parseClock('24:00')).toBeNull();
    expect(parseClock('24:00', true)).toBe(1440);
    expect(parseClock('25:00')).toBeNull();
    expect(formatClock(120)).toBe('02:00');
  });
});
