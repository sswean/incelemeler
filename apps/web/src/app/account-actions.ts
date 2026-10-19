'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { problemCode } from '../lib/errors';
import { api, clearSessionCookie, getSessionToken } from '../lib/session';

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v : '';
}

export async function removeFavoriteAction(form: FormData): Promise<void> {
  const token = await getSessionToken();
  if (!token) redirect('/giris?sonra=%2Fhesabim%2Fkaydedilenler');
  await (
    await api(token)
  ).DELETE('/v1/me/favorites/{listingId}', {
    params: { path: { listingId: str(form, 'listingId') } },
  });
  revalidatePath('/hesabim/kaydedilenler');
  redirect('/hesabim/kaydedilenler');
}

/** Hesabım › Hesabımı sil (≤ 3 adım; REQ-KVK-020): parola + açık onay kutusu. */
export async function deleteAccountAction(form: FormData): Promise<void> {
  const token = await getSessionToken();
  if (!token) redirect('/giris?sonra=%2Fhesabim%2Fhesabi-sil');
  if (form.get('confirm') !== '1') redirect('/hesabim/hesabi-sil?hata=VALIDATION_FAILED');
  const { data, error } = await (
    await api(token)
  ).POST('/v1/me/deletion', { body: { password: str(form, 'password'), confirm: true } });
  if (!data) redirect(`/hesabim/hesabi-sil?hata=${problemCode(error)}`);
  await clearSessionCookie();
  redirect(`/hesap-silme?durum=bekliyor&tarih=${encodeURIComponent(data.scheduledFor)}`);
}

export async function requestDeletionByEmailAction(form: FormData): Promise<void> {
  const { error } = await (
    await api()
  ).POST('/v1/account-deletion/request', { body: { email: str(form, 'email') } });
  redirect(error ? `/hesap-silme?hata=${problemCode(error)}` : '/hesap-silme?durum=gonderildi');
}

export async function confirmDeletionAction(form: FormData): Promise<void> {
  const { data, error } = await (
    await api()
  ).POST('/v1/account-deletion/confirm', { body: { token: str(form, 'belirtec') } });
  if (!data) redirect(`/hesap-silme?hata=${problemCode(error)}`);
  await clearSessionCookie();
  redirect(`/hesap-silme?durum=bekliyor&tarih=${encodeURIComponent(data.scheduledFor)}`);
}

export async function cancelDeletionAction(form: FormData): Promise<void> {
  const { data, error } = await (
    await api()
  ).POST('/v1/account-deletion/cancel', { body: { token: str(form, 'belirtec') } });
  redirect(data ? '/hesap-silme?durum=iptal' : `/hesap-silme?hata=${problemCode(error)}`);
}
