import { tr } from '@incelemeler/i18n';

const T = tr.campaigns;

/** Alan hatası kodu → Türkçe mesaj (bilinmeyen kod genel mesaja düşer). */
export function fieldMessage(code: string | undefined): string | null {
  if (!code) return null;
  return code in T.fieldErrors
    ? T.fieldErrors[code as keyof typeof T.fieldErrors]
    : T.fieldErrors.invalid;
}

export function formatKurus(kurus: number): string {
  return (kurus / 100).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
}

export function formatIstanbul(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function percent(v: number | null): string {
  return v === null ? '—' : `%${(v * 100).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`;
}
