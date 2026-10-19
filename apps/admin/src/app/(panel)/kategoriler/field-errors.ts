import { tr } from '@incelemeler/i18n';

type FieldErrorCode = keyof typeof tr.taxonomy.fieldErrors;

/** API alan hata kodunu (RFC 9457 `errors[].code`) Türkçe metne çevirir. */
export function fieldErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return code in tr.taxonomy.fieldErrors
    ? tr.taxonomy.fieldErrors[code as FieldErrorCode]
    : tr.taxonomy.fieldErrors.invalid;
}

/** `errors[].pointer` → alan adı (ya da `full` ise tam yol, ör. `location/districtId`) → hata kodu. */
export function fieldErrorsOf(error: unknown, full = false): Record<string, string> {
  const out: Record<string, string> = {};
  const errors = (error as { errors?: Array<{ pointer: string; code: string }> } | undefined)
    ?.errors;
  for (const e of errors ?? []) {
    const path = e.pointer.replace(/^\//, '');
    const field = (full ? path : path.split('/')[0]) || 'form';
    out[field] ??= e.code;
  }
  return out;
}
