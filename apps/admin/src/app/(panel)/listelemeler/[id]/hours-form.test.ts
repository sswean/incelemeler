import { describe, expect, it } from 'vitest';
import { OpeningHoursBody } from '@incelemeler/contracts';
import { exceptionsToText, fieldName, parseHoursForm } from './hours-form';

const form = (values: Record<string, string>) => (k: string) => values[k] ?? '';

describe('panel çalışma saatleri formu', () => {
  it('[REQ-VER-010] haftalık aralıklar, gece yarısını aşan aralık ve özel günler gövdeye çevrilir', () => {
    const r = parseHoursForm(
      form({
        saatDilimi: 'Europe/Istanbul',
        [fieldName(1, 0, 'o')]: '18:00',
        [fieldName(1, 0, 'c')]: '02:00',
        [fieldName(6, 0, 'o')]: '09:00',
        [fieldName(6, 0, 'c')]: '12:00',
        [fieldName(6, 1, 'o')]: '13:00',
        [fieldName(6, 1, 'c')]: '24:00',
        istisnalar: '2026-10-29 Kapalı Cumhuriyet Bayramı\n\n2026-10-30 20:00-23:00',
        dogrulandi: 'on',
      }),
    );
    expect('body' in r && OpeningHoursBody.parse(r.body)).toEqual({
      timezone: 'Europe/Istanbul',
      weekly: [
        { day: 1, opens: '18:00', closes: '02:00' },
        { day: 6, opens: '09:00', closes: '12:00' },
        { day: 6, opens: '13:00', closes: '24:00' },
      ],
      exceptions: [
        { date: '2026-10-29', closed: true, note: 'Cumhuriyet Bayramı' },
        { date: '2026-10-30', closed: false, opens: '20:00', closes: '23:00' },
      ],
      verified: true,
    });
  });

  it('[REQ-VER-010] eksik ya da biçimsiz saat ve anlaşılamayan özel gün satırı reddedilir', () => {
    expect(parseHoursForm(form({ [fieldName(2, 0, 'o')]: '09:00' }))).toEqual({
      error: 'invalid_clock',
    });
    expect(
      parseHoursForm(form({ [fieldName(2, 0, 'o')]: '9:00', [fieldName(2, 0, 'c')]: '17:00' })),
    ).toEqual({ error: 'invalid_clock' });
    expect(parseHoursForm(form({ istisnalar: '29 Ekim kapalı' }))).toEqual({
      error: 'invalid_exception',
    });
    expect(parseHoursForm(form({ istisnalar: '2026-10-30 25:00-23:00' }))).toEqual({
      error: 'invalid_clock',
    });
  });

  it('[REQ-VER-010] kayıtlı özel günler aynı biçimde metne döner', () => {
    const text = exceptionsToText({
      timezone: 'Europe/Istanbul',
      weekly: [],
      exceptions: [
        { date: '2026-10-29', closed: true, opens: null, closes: null, note: 'Bayram' },
        { date: '2026-10-30', closed: false, opens: '20:00', closes: '23:00', note: null },
      ],
      verifiedAt: null,
      openNow: null,
    });
    expect(text).toBe('2026-10-29 kapalı Bayram\n2026-10-30 20:00-23:00');
    const back = parseHoursForm(form({ istisnalar: text }));
    expect('body' in back && back.body.exceptions).toHaveLength(2);
  });
});
