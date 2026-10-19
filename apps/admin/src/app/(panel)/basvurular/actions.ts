'use server';

import { redirect } from 'next/navigation';
import type { ApplicationRejection } from '@incelemeler/contracts';
import { problemCode } from '../../../lib/errors';
import { api, getSessionToken } from '../../../lib/session';

function text(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

/** Başvuru kararı (REQ-ISL-001/002): onay ya da gerekçeli ret; başvurana e-posta API'den. */
export async function decideApplicationAction(form: FormData): Promise<void> {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  const decision = text(form, 'decision') === 'REJECT' ? 'REJECT' : 'APPROVE';
  const reason = text(form, 'reason');
  const note = text(form, 'note');
  // Dönüş yalnızca bu sayfaya (açık yönlendirme yok).
  const back = /^\/basvurular(\?[A-Za-z0-9=&_-]*)?$/.test(text(form, 'back'))
    ? text(form, 'back')
    : '/basvurular';
  const { data, error } = await (
    await api(token)
  ).POST('/v1/admin/applications/{id}/decision', {
    params: { path: { id: text(form, 'id') } },
    body: {
      version: Number(text(form, 'version')),
      decision,
      ...(decision === 'REJECT' && reason ? { reason: reason as ApplicationRejection } : {}),
      ...(note ? { note } : {}),
    },
  });
  const sep = back.includes('?') ? '&' : '?';
  redirect(`${back}${sep}${data ? 'sonuc=karar' : `hata=${problemCode(error)}`}`);
}
