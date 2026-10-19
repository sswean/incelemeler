import { hash, verify } from '@node-rs/argon2';
import { lowerTr } from '@incelemeler/utils';
import { COMMON_PASSWORDS } from './common-passwords.js';

/**
 * Argon2id parametreleri (REQ-HSP-003). OWASP Password Storage Cheat Sheet'in Argon2id için önerdiği
 * asgari yapılandırmalardan biri (m=19 MiB, t=2, p=1) — güncel metin doğrulanmalı (ADR-0003).
 */
const ARGON2 = { memoryCost: 19_456, timeCost: 2, parallelism: 1, outputLen: 32 } as const;
const ALGORITHM_ARGON2ID = 2;

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

export function hashPassword(password: string): Promise<string> {
  return hash(password, { ...ARGON2, algorithm: ALGORITHM_ARGON2ID });
}

export async function verifyPassword(hashed: string, password: string): Promise<boolean> {
  try {
    return await verify(hashed, password);
  } catch {
    return false;
  }
}

export type PasswordProblem = 'TOO_SHORT' | 'TOO_LONG' | 'TOO_COMMON' | 'CONTAINS_EMAIL';

/**
 * Parola politikası: 10–128 karakter, yaygın parola listesinde değil, e-posta adının yerel kısmını içermez.
 * Sızıntı veritabanı kontrolü (k-anonimlik) X-011 sağlanınca eklenecek.
 */
export function checkPassword(password: string, email?: string): PasswordProblem | null {
  if ([...password].length < PASSWORD_MIN) return 'TOO_SHORT';
  if ([...password].length > PASSWORD_MAX) return 'TOO_LONG';
  const lower = lowerTr(password);
  if (COMMON_PASSWORDS.has(lower)) return 'TOO_COMMON';
  const local = email ? lowerTr(email.split('@')[0] ?? '') : '';
  if (local.length >= 4 && lower.includes(local)) return 'CONTAINS_EMAIL';
  return null;
}
