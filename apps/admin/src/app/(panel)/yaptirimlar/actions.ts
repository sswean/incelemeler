'use server';

import { redirect } from 'next/navigation';
import type { SanctionLevel, SanctionReason } from '@incelemeler/contracts';
import { problemCode } from '../../../lib/errors';
import { api, getSessionToken } from '../../../lib/session';

function text(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
async function client() {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  return api(token);
}
const back = (ok: string | null, error?: unknown) =>
  redirect(`/yaptirimlar?${ok ? `durum=${ok}` : `hata=${problemCode(error)}`}`);

/** Yaptırım uygula (REQ-GUN-007): basamak önerisi API'de; atlama gerekçeli. */
export async function issueSanctionAction(form: FormData): Promise<void> {
  const days = Number(text(form, 'durationDays'));
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/sanctions', {
    body: {
      email: text(form, 'email'),
      level: text(form, 'level') as SanctionLevel,
      reasonCode: text(form, 'reasonCode') as SanctionReason,
      note: text(form, 'note'),
      ...(days > 0 ? { durationDays: days } : {}),
      skipLevel: form.get('skipLevel') === '1',
    },
  });
  if (!data) back(null, error);
  redirect(`/yaptirimlar?durum=uygulandi&oneri=${data!.suggestedLevel}`);
}

export async function revokeSanctionAction(form: FormData): Promise<void> {
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/sanctions/{id}/revoke', {
    params: { path: { id: text(form, 'id') } },
    body: { version: Number(text(form, 'version')), note: text(form, 'note') },
  });
  back(data ? 'kaydedildi' : null, error);
}

export async function decideSanctionAppealAction(form: FormData): Promise<void> {
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/sanctions/{id}/appeal-decision', {
    params: { path: { id: text(form, 'id') } },
    body: {
      version: Number(text(form, 'version')),
      outcome: text(form, 'outcome') === 'OVERTURNED' ? 'OVERTURNED' : 'UPHELD',
      note: text(form, 'note'),
    },
  });
  back(data ? 'kaydedildi' : null, error);
}

/** Toplu sahte değerlendirme temizliği: listeleme herkese açık adresinden bulunur. */
export async function integrityAction(form: FormData): Promise<void> {
  const c = await client();
  const { data: listing } = await c.GET('/v1/listings/{slug}', {
    params: { path: { slug: text(form, 'slug') } },
  });
  if (!listing) back(null, { code: 'NOT_FOUND' });
  const ids = text(form, 'reviewIds')
    .split(/\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const { data, error } = await c.POST('/v1/admin/listings/{id}/review-integrity', {
    params: { path: { id: listing!.id } },
    body: { reviewIds: ids, note: text(form, 'note') },
  });
  if (!data) back(null, error);
  redirect(`/yaptirimlar?durum=temizlendi&n=${data!.removed}`);
}
