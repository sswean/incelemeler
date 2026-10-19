'use server';

import { redirect } from 'next/navigation';
import { MediaSourceType } from '@incelemeler/contracts';
import { problemCode } from '../../../../lib/errors';
import { api, getSessionToken } from '../../../../lib/session';

function text(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
const orNull = (v: string) => (v ? v : null);

export async function saveMediaLicenseAction(form: FormData): Promise<void> {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  const id = text(form, 'id');
  const back = text(form, 'back');
  const focal = (k: string) => {
    const n = Number(text(form, k).replace(',', '.'));
    return Number.isFinite(n) && n >= 0 && n <= 1 ? n : undefined;
  };
  const expires = text(form, 'licenseExpiresAt');
  const { data, error } = await (
    await api(token)
  ).PATCH('/v1/admin/media/{id}', {
    params: { path: { id } },
    body: {
      version: Number.parseInt(text(form, 'version'), 10),
      altText: orNull(text(form, 'altText')),
      sourceType: MediaSourceType.safeParse(text(form, 'sourceType')).data ?? null,
      rightsHolder: orNull(text(form, 'rightsHolder')),
      licenseType: orNull(text(form, 'licenseType')),
      permissionRef: orNull(text(form, 'permissionRef')),
      licenseExpiresAt: expires ? `${expires}T00:00:00.000Z` : null,
      modelPropertyRelease: form.get('modelPropertyRelease') === '1',
      focalX: focal('focalX'),
      focalY: focal('focalY'),
    },
  });
  const qs = back ? `listeleme=${back.split('/').pop()}&` : '';
  if (!data) redirect(`/medya/${id}?${qs}hata=${problemCode(error)}`);
  redirect(back ? `${back}?durum=kaydedildi` : `/medya/${id}?durum=kaydedildi`);
}
