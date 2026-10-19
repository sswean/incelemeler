import { tr } from '@incelemeler/i18n';

type Code = keyof typeof tr.errors;

/** API hata kodunu (RFC 9457 `code`) Türkçe kullanıcı mesajına çevirir. */
export function errorMessage(code: string | undefined | null): string {
  if (code && code in tr.errors) return tr.errors[code as Code];
  return tr.errors.UNKNOWN;
}

export function problemCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return 'UNKNOWN';
}
