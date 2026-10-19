'use server';

import { redirect } from 'next/navigation';
import { problemCode } from '../../../../lib/errors';
import { api, getSessionToken } from '../../../../lib/session';

const KEYS = [
  'maintenanceMode',
  'sponsoredDisabled',
  'reviewsDisabled',
  'registrationDisabled',
  'integrationsDisabled',
] as const;

/** İşletim anahtarları (REQ-OPS-009): tüm anahtarlar birlikte, gerekçeyle. */
export async function updateOpsSwitchesAction(form: FormData): Promise<void> {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  const reason = form.get('reason');
  const { data, error } = await (
    await api(token)
  ).PUT('/v1/admin/ops-switches', {
    body: {
      version: Number(form.get('version')),
      reason: typeof reason === 'string' ? reason.trim() : '',
      ...Object.fromEntries(KEYS.map((k) => [k, form.get(k) === '1'])),
    },
  });
  redirect(`/ayarlar/isletim?${data ? 'durum=kaydedildi' : `hata=${problemCode(error)}`}`);
}
