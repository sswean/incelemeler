'use server';

import { redirect } from 'next/navigation';
import { problemCode } from '../../../lib/errors';
import { api, getSessionToken } from '../../../lib/session';
import { parseHoursForm } from './[id]/hours-form';

const ANCHOR = '#calisma-saatleri';

/** Çalışma saatlerini tümüyle değiştirir (REQ-VER-010). */
export async function saveOpeningHoursAction(form: FormData): Promise<void> {
  const get = (k: string) => {
    const v = form.get(k);
    return typeof v === 'string' ? v.trim() : '';
  };
  const listingId = get('listingId');
  const parsed = parseHoursForm(get);
  if ('error' in parsed) redirect(`/listelemeler/${listingId}?saat=${parsed.error}${ANCHOR}`);
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  const { data, error } = await (
    await api(token)
  ).PUT('/v1/admin/listings/{id}/opening-hours', {
    params: { path: { id: listingId } },
    body: parsed.body,
  });
  if (!data) {
    const first = (error as { errors?: Array<{ code?: string }> } | undefined)?.errors?.[0]?.code;
    const q = new URLSearchParams({ hata: problemCode(error), saat: first ?? 'invalid' });
    redirect(`/listelemeler/${listingId}?${q.toString()}${ANCHOR}`);
  }
  redirect(`/listelemeler/${listingId}?durum=saatler-kaydedildi${ANCHOR}`);
}
