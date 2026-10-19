'use server';

import { redirect } from 'next/navigation';
import { problemCode } from '../../../../lib/errors';
import { api, getSessionToken } from '../../../../lib/session';
import { THRESHOLD_KEYS } from './keys';

export async function saveThresholdsAction(form: FormData): Promise<void> {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  const num = (k: string) => Number.parseInt(String(form.get(k) ?? ''), 10);
  const body = Object.fromEntries(THRESHOLD_KEYS.map((k) => [k, num(k)])) as Record<
    (typeof THRESHOLD_KEYS)[number],
    number
  >;
  const { data, error } = await (
    await api(token)
  ).PUT('/v1/admin/settings/thresholds', { body: { ...body, version: num('version') } });
  redirect(`/ayarlar/esikler?${data ? 'durum=kaydedildi' : `hata=${problemCode(error)}`}`);
}
