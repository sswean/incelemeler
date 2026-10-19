import { z } from 'zod';

/**
 * Çerez onayı (REQ-KVK-010…014). Tercih çerezi zorunlu kategoridedir (onay tercihinin kendisi); içinde kişisel
 * veri yok: rastgele anonim kimlik + kategori bayrakları + zaman.
 */
export const CONSENT_COOKIE = 'cerez_tercihi';
/** Çerez politikası metni sürümü (TASLAK; hukuki onayla değişir — REQ-KVK-004). */
export const CONSENT_TEXT_VERSION = '2026-10-taslak';
/** Tercih çerezinin ömrü (gün) — A-023. */
export const CONSENT_COOKIE_DAYS = 180;

export const ConsentPurpose = z.enum(['FUNCTIONAL', 'ANALYTICS', 'MARKETING']);
export type ConsentPurpose = z.infer<typeof ConsentPurpose>;

export interface ConsentState {
  anonymousId: string;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  /** Karar zamanı (epoch saniye). */
  at: number;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const bit = (b: boolean) => (b ? '1' : '0');

/** Çerez değeri: `1.{anonimKimlik}.{işlevsel}{analitik}{pazarlama}.{zaman}` */
export function encodeConsent(s: ConsentState): string {
  return `1.${s.anonymousId}.${bit(s.functional)}${bit(s.analytics)}${bit(s.marketing)}.${s.at}`;
}

export function decodeConsent(value: string | null | undefined): ConsentState | null {
  if (!value) return null;
  const [version, id, flags, at] = decodeURIComponent(value).split('.');
  if (version !== '1' || !id || !UUID.test(id) || !flags || !/^[01]{3}$/.test(flags)) return null;
  const ts = Number(at);
  if (!Number.isInteger(ts) || ts <= 0) return null;
  return {
    anonymousId: id,
    functional: flags[0] === '1',
    analytics: flags[1] === '1',
    marketing: flags[2] === '1',
    at: ts,
  };
}

export const ConsentBody = z.object({
  anonymousId: z.string().regex(UUID),
  functional: z.boolean(),
  analytics: z.boolean(),
  marketing: z.boolean(),
  textVersion: z.string().min(1).max(40),
  channel: z.enum(['WEB', 'IOS', 'ANDROID']).default('WEB'),
});
export type ConsentBody = z.infer<typeof ConsentBody>;
