import { tr } from '@incelemeler/i18n';

type FieldErrorCode = keyof typeof tr.taxonomy.fieldErrors;

/** API alan hata kodunu (RFC 9457 `errors[].code`) Türkçe metne çevirir. */
export function fieldErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return code in tr.taxonomy.fieldErrors
    ? tr.taxonomy.fieldErrors[code as FieldErrorCode]
    : tr.taxonomy.fieldErrors.invalid;
}

/** `errors[].pointer` → alan adı → hata kodu (ilk hata). */
export function fieldErrorsOf(error: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  const errors = (error as { errors?: Array<{ pointer: string; code: string }> } | undefined)
    ?.errors;
  for (const e of errors ?? []) {
    const field = e.pointer.replace(/^\//, '').split('/')[0] || 'form';
    out[field] ??= e.code;
  }
  return out;
}
