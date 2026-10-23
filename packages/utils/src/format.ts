/**
 * tr-TR biçimlendirme yardımcıları (REQ-YRL-003, §4.3).
 * Para veritabanında tamsayı kuruş (minor unit) + ISO 4217 kodu olarak tutulur (REQ-VER-011).
 */

export const TIME_ZONE = 'Europe/Istanbul';

export function formatMoney(amountMinor: number, currency = 'TRY'): string {
  if (!Number.isInteger(amountMinor)) {
    throw new TypeError('amountMinor tamsayı (kuruş) olmalıdır');
  }
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amountMinor / 100);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

/** "Ekim 2026" (deneyim beyanında ziyaret ayı — REQ-ICR-007). */
export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: TIME_ZONE,
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** Editör puanı gösterimi: 10 üzerinden, gerektiğinde tek ondalık ("8,5/10", "8/10"). */
export function formatEditorialScore(score: number): string {
  const n = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(score);
  return `${n}/10`;
}

/** Kullanıcı puanı gösterimi: tek ondalık, virgülle ("4,3"). */
export function formatRating(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/** Mesafe: < 1000 m için "350 m", aksi hâlde "1,2 km". */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(meters / 1000)} km`;
}
