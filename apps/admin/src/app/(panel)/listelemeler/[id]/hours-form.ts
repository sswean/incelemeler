import type { OpeningHours, OpeningHoursBody } from '@incelemeler/contracts';

/** Gün başına en çok iki aralık (öğle arası ya da gece yarısını aşan ikinci oturum). */
export const RANGES_PER_DAY = 2;
export const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export const fieldName = (day: number, i: number, part: 'o' | 'c') => `g${day}a${i}${part}`;

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
const CLOSING = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;
/** "2026-10-29 kapalı [not]" ya da "2026-10-30 20:00-23:00 [not]"; "Kapalı/KAPALI" da kabul edilir. */
const EXCEPTION =
  /^(\d{4}-\d{2}-\d{2})\s+(?:(kapalı|kapali)|(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2}))(?:\s+(.+))?$/i;

export type HoursFormResult = { body: OpeningHoursBody } | { error: string };

/** Panel formunu API gövdesine çevirir; biçim hatası alan kodu döner (API ayrıca doğrular). */
export function parseHoursForm(get: (key: string) => string): HoursFormResult {
  const weekly: OpeningHoursBody['weekly'] = [];
  for (const day of DAYS) {
    for (let i = 0; i < RANGES_PER_DAY; i++) {
      const opens = get(fieldName(day, i, 'o'));
      const closes = get(fieldName(day, i, 'c'));
      if (!opens && !closes) continue;
      if (!CLOCK.test(opens) || !CLOSING.test(closes)) return { error: 'invalid_clock' };
      weekly.push({ day, opens, closes });
    }
  }
  const exceptions: OpeningHoursBody['exceptions'] = [];
  for (const raw of get('istisnalar').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = EXCEPTION.exec(line);
    if (!m) return { error: 'invalid_exception' };
    const note = m[5]?.trim();
    if (m[2]) {
      exceptions.push({ date: m[1]!, closed: true, ...(note ? { note } : {}) });
    } else {
      if (!CLOCK.test(m[3]!) || !CLOSING.test(m[4]!)) return { error: 'invalid_clock' };
      exceptions.push({
        date: m[1]!,
        closed: false,
        opens: m[3]!,
        closes: m[4]!,
        ...(note ? { note } : {}),
      });
    }
  }
  return {
    body: {
      timezone: get('saatDilimi') || 'Europe/Istanbul',
      weekly,
      exceptions,
      verified: get('dogrulandi') === 'on',
    },
  };
}

/** Kayıtlı istisnaları düzenlenebilir metne çevirir (parseHoursForm'un tersi). */
export function exceptionsToText(hours: OpeningHours | null | undefined): string {
  return (hours?.exceptions ?? [])
    .map((e) =>
      [e.date, e.closed ? 'kapalı' : `${e.opens}-${e.closes}`, e.note ?? '']
        .filter(Boolean)
        .join(' '),
    )
    .join('\n');
}
