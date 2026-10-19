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

/** KVKK başvurusu (REQ-KVK-022): oturum varsa hesaba bağlanır; yoksa e-postayla doğrulanır. */
export async function dataRequestAction(form: FormData): Promise<void> {
  const token = await getSessionToken();
  const email = str(form, 'email');
  const { data, error } = await (
    await api(token)
  ).POST('/v1/data-requests', {
    body: {
      type: str(form, 'type') as 'INFO',
      description: str(form, 'description'),
      ...(email ? { email } : {}),
    },
  });
  if (!data) redirect(`/kvkk-basvuru?hata=${problemCode(error)}`);
  redirect(`/kvkk-basvuru?durum=${data.verificationRequired ? 'dogrula' : 'alindi'}`);
}

export async function verifyDataRequestAction(form: FormData): Promise<void> {
  const { error } = await (
    await api()
  ).POST('/v1/data-requests/verify', { body: { token: str(form, 'belirtec') } });
  redirect(error ? `/kvkk-basvuru?hata=${problemCode(error)}` : '/kvkk-basvuru?durum=dogrulandi');
}

/** Yaptırıma itiraz (REQ-GUN-007): e-postadaki imzalı bağlantıyla. */
export async function sanctionAppealAction(form: FormData): Promise<void> {
  const token = str(form, 'belirtec');
  const { error } = await (
    await api()
  ).POST('/v1/sanction-appeals', { body: { token, statement: str(form, 'statement') } });
  redirect(
    error
      ? `/itiraz/yaptirim?belirtec=${encodeURIComponent(token)}&hata=${problemCode(error)}`
      : '/itiraz/yaptirim?durum=gonderildi',
  );
}

/** Hukuki talep (REQ-GUN-005): girişsiz; resmî kararlar bu kanaldan alınmaz. */
export async function takedownAction(form: FormData): Promise<void> {
  const opt = (k: string) => (str(form, k).trim() ? str(form, k).trim() : undefined);
  const { data, error } = await (
    await api()
  ).POST('/v1/takedown-requests', {
    body: {
      kind: str(form, 'kind') as 'COPYRIGHT',
      requesterName: str(form, 'requesterName'),
      ...(opt('requesterOrg') ? { requesterOrg: opt('requesterOrg') } : {}),
      requesterEmail: str(form, 'requesterEmail'),
      requesterCapacity: str(form, 'requesterCapacity') as 'RIGHT_HOLDER',
      targetUrl: str(form, 'targetUrl'),
      legalBasis: str(form, 'legalBasis'),
      ...(opt('documentsNote') ? { documentsNote: opt('documentsNote') } : {}),
      // İşaretsizse false gider; sözleşme reddeder.
      goodFaithAck: (form.get('goodFaithAck') === '1') as true,
    },
  });
  if (!data) redirect(`/hukuki-talep?hata=${problemCode(error)}`);
  redirect(
    `/hukuki-talep?durum=alindi&ref=${encodeURIComponent(data.reference)}&son=${encodeURIComponent(data.dueAt)}`,
  );
}
