/**
 * Çalışma saatleri ve "Şu an açık" (REQ-VER-010). Gün ISO numarasıdır (1 = Pazartesi … 7 = Pazar); saatler gece
 * yarısından itibaren dakika. `closes <= opens` aralığı gece yarısını aşar (18:00–02:00). 24 saat: 0–1440.
 * Aynı kural aramadaki SQL filtresinde de uygulanır (postgres-search.adapter, aynı senaryolarla testli).
 */
export interface WeeklyRange {
  day: number;
  opens: number;
  closes: number;
}
export interface HoursException {
  /** Yerel tarih YYYY-AA-GG. */
  date: string;
  closed: boolean;
  opens?: number | null;
  closes?: number | null;
}

export const DEFAULT_TIMEZONE = 'Europe/Istanbul';

/** Saat dilimindeki yerel tarih, ISO gün ve dakika. */
export function localParts(
  now: Date,
  timeZone: string,
): { date: string; day: number; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const days: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return {
    date: `${parts['year']}-${parts['month']}-${parts['day']}`,
    day: days[parts['weekday']!]!,
    minutes: Number(parts['hour']) * 60 + Number(parts['minute']),
  };
}

function previousDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function rangesFor(
  date: string,
  day: number,
  weekly: readonly WeeklyRange[],
  exceptions: readonly HoursException[],
): Array<{ opens: number; closes: number }> {
  const ex = exceptions.find((e) => e.date === date);
  if (ex) {
    return ex.closed || ex.opens == null || ex.closes == null
      ? []
      : [{ opens: ex.opens, closes: ex.closes }];
  }
  return weekly.filter((r) => r.day === day);
}

/** Açık mı? Haftalık düzen girilmemişse bilinmiyor (`null`) — "kapalı" gösterilmez. */
export function isOpenAt(
  weekly: readonly WeeklyRange[],
  exceptions: readonly HoursException[],
  timeZone: string,
  now: Date,
): boolean | null {
  if (!weekly.length) return null;
  const today = localParts(now, timeZone);
  const yesterday = { date: previousDate(today.date), day: today.day === 1 ? 7 : today.day - 1 };
  const m = today.minutes;
  const openToday = rangesFor(today.date, today.day, weekly, exceptions).some((r) =>
    r.closes > r.opens ? r.opens <= m && m < r.closes : r.opens <= m,
  );
  const carryOver = rangesFor(yesterday.date, yesterday.day, weekly, exceptions).some(
    (r) => r.closes <= r.opens && m < r.closes,
  );
  return openToday || carryOver;
}

/** "18:00" → 1080; "24:00" yalnızca kapanışta. */
export function parseClock(value: string, closing = false): number | null {
  const m = /^([01]\d|2[0-4]):([0-5]\d)$/.exec(value);
  if (!m) return null;
  const minutes = Number(m[1]) * 60 + Number(m[2]);
  if (minutes > 1440 || (minutes === 1440 && !closing)) return null;
  return minutes;
}

export function formatClock(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
