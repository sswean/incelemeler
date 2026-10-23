'use server';

import { redirect } from 'next/navigation';
import { problemCode } from '../../../lib/errors';
import { api, getSessionToken } from '../../../lib/session';
import { parseVerdictForm } from './[id]/verdict-form';

const ANCHOR = '#editor-degerlendirmesi';

function text(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
async function client() {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  return api(token);
}
function failure(listingId: string, error: unknown): never {
  const code = problemCode(error);
  redirect(
    `/listelemeler/${listingId}?degerlendirme=${code === 'PRECONDITION_FAILED' ? code : 'invalid'}${ANCHOR}`,
  );
}

/** Editör değerlendirmesinin yeni sürümünü kaydeder (REQ-VER-005). */
export async function saveVerdictAction(form: FormData): Promise<void> {
  const listingId = text(form, 'listingId');
  const parsed = parseVerdictForm((k) => text(form, k));
  if ('error' in parsed)
    redirect(`/listelemeler/${listingId}?degerlendirme=${parsed.error}${ANCHOR}`);
  const { data, error } = await (
    await client()
  ).PUT('/v1/admin/listings/{id}/verdict', {
    params: { path: { id: listingId } },
    body: parsed.body,
  });
  if (!data) failure(listingId, error);
  redirect(`/listelemeler/${listingId}?durum=degerlendirme-kaydedildi${ANCHOR}`);
}

export async function publishVerdictAction(form: FormData): Promise<void> {
  const listingId = text(form, 'listingId');
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/listings/{id}/verdict/publish', {
    params: { path: { id: listingId } },
    body: { version: Number.parseInt(text(form, 'version'), 10) },
  });
  if (!data) failure(listingId, error);
  redirect(`/listelemeler/${listingId}?durum=degerlendirme-yayimlandi${ANCHOR}`);
}
