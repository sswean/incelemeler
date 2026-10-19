'use server';

import { redirect } from 'next/navigation';
import { STATIC_PATHS } from '@incelemeler/routes';
import { problemCode } from '../lib/errors';
import { api } from '../lib/session';

/** Form durumu: hata hâlinde girilen değerler geri verilir (alanlar yeniden doldurulur). */
export type ApplicationFormState = {
  status: 'idle' | 'sent' | 'error';
  code: string | null;
  /** Alan adı → hata kodu (sözleşme/zod kodu). */
  fields: Record<string, string>;
  values: Record<string, string | string[]>;
  attempt: number;
};

const MULTI = new Set(['products', 'provinceIds', 'categoryIds']);

function collect(form: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v !== 'string' || k.startsWith('$')) continue;
    if (MULTI.has(k)) out[k] = [...((out[k] as string[] | undefined) ?? []), v];
    else out[k] = v.trim();
  }
  return out;
}

function fieldsOf(error: unknown): Record<string, string> {
  const list =
    error && typeof error === 'object' && 'errors' in error && Array.isArray(error.errors)
      ? (error.errors as Array<{ pointer?: string; code?: string }>)
      : [];
  const out: Record<string, string> = {};
  for (const e of list) {
    const key = (e.pointer ?? '').replace(/^\/body/, '').split('/')[1];
    if (key && !out[key]) out[key] = e.code ?? 'invalid';
  }
  return out;
}

/** Hesapsız başvuru (REQ-ISL-001/002): girişsiz; API e-posta doğrulaması gönderir. */
export async function submitApplicationAction(
  prev: ApplicationFormState,
  form: FormData,
): Promise<ApplicationFormState> {
  const v = collect(form);
  const s = (k: string) => (typeof v[k] === 'string' && v[k] ? (v[k] as string) : undefined);
  const list = (k: string) => (Array.isArray(v[k]) ? (v[k] as string[]) : []);
  const opt = <K extends string>(k: K) =>
    (s(k) ? { [k]: s(k)! } : {}) as Partial<Record<K, string>>;
  // Onay kutusu işaretsizse `false` gönderilir; sözleşme reddeder (alan hatası gösterilir).
  const ack = (k: string) => (v[k] === '1') as true;
  const client = await api();
  const { data, error } =
    v['type'] === 'ADVERTISING'
      ? await client.POST('/v1/applications', {
          body: {
            type: 'ADVERTISING',
            organizationName: s('organizationName') ?? '',
            contactName: s('contactName') ?? '',
            ...opt('contactRole'),
            email: s('email') ?? '',
            ...opt('phone'),
            products: list('products') as Array<'SPONSORED_CONTENT'>,
            provinceIds: list('provinceIds'),
            categoryIds: list('categoryIds'),
            ...(s('budgetRange') ? { budgetRange: s('budgetRange') as 'UNDER_10K' } : {}),
            message: s('message') ?? '',
            privacyNoticeAck: ack('privacyNoticeAck'),
            marketingConsent: v['marketingConsent'] === '1',
          },
        })
      : await client.POST('/v1/applications', {
          body: {
            type: 'BUSINESS',
            businessName: s('businessName') ?? '',
            kind: (s('kind') ?? 'PLACE') as 'PLACE',
            categoryId: s('categoryId') ?? '',
            provinceId: s('provinceId') ?? '',
            ...opt('address'),
            ...opt('serviceArea'),
            ...opt('phone'),
            ...opt('website'),
            contactName: s('contactName') ?? '',
            contactRole: s('contactRole') ?? '',
            email: s('email') ?? '',
            privacyNoticeAck: ack('privacyNoticeAck'),
            authorityAck: ack('authorityAck'),
          },
        });
  if (data)
    return { status: 'sent', code: null, fields: {}, values: {}, attempt: prev.attempt + 1 };
  return {
    status: 'error',
    code: problemCode(error),
    fields: fieldsOf(error),
    values: v,
    attempt: prev.attempt + 1,
  };
}

export async function verifyApplicationAction(form: FormData): Promise<void> {
  const path = form.get('tur') === 'reklam' ? STATIC_PATHS.advertise : STATIC_PATHS.addBusiness;
  const token = form.get('belirtec');
  const { error } = await (
    await api()
  ).POST('/v1/applications/verify', { body: { token: typeof token === 'string' ? token : '' } });
  redirect(error ? `${path}?hata=${problemCode(error)}` : `${path}?durum=dogrulandi`);
}
