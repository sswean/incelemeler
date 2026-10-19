'use server';

import { redirect } from 'next/navigation';
import { api, clearSessionCookie, getSessionToken, setSessionCookie } from '../lib/session';
import { problemCode } from '../lib/errors';

const TERMS_VERSION = '2026-10-taslak';

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v : '';
}

/** Girişten sonra dönülecek yol: yalnızca site içi göreli yol (açık yönlendirme yok). */
function safeNext(v: string): string | null {
  return v.startsWith('/') && !v.startsWith('//') && !v.includes('\\') && v.length <= 300
    ? v
    : null;
}

export async function loginAction(form: FormData): Promise<void> {
  const { data, error } = await (
    await api()
  ).POST('/v1/auth/login', {
    body: { email: str(form, 'email'), password: str(form, 'password') },
  });
  const next = safeNext(str(form, 'sonra'));
  if (!data) {
    redirect(
      `/giris?hata=${problemCode(error)}${next ? `&sonra=${encodeURIComponent(next)}` : ''}`,
    );
  }
  await setSessionCookie(data.sessionToken, data.expiresAt);
  // Esaslı değişiklik sonrası yeniden kabul (REQ-KVK-004): bir sonraki girişte.
  const { data: pending } = await (
    await api(data.sessionToken)
  ).GET('/v1/me/legal-acceptances/pending');
  if (pending?.data.length) {
    redirect(`/kosullar/kabul?sonra=${encodeURIComponent(next ?? '/hesabim')}`);
  }
  redirect(next ?? '/hesabim');
}

export async function acceptLegalAction(form: FormData): Promise<void> {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  const next = safeNext(str(form, 'sonra')) ?? '/hesabim';
  if (str(form, 'confirm') !== '1') {
    redirect(`/kosullar/kabul?hata=VALIDATION_FAILED&sonra=${encodeURIComponent(next)}`);
  }
  const versionIds = form.getAll('versionId').filter((v): v is string => typeof v === 'string');
  const { data, error } = await (
    await api(token)
  ).POST('/v1/me/legal-acceptances', { body: { versionIds } });
  if (!data) {
    redirect(`/kosullar/kabul?hata=${problemCode(error)}&sonra=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function registerAction(form: FormData): Promise<void> {
  if (str(form, 'termsConfirm') !== '1' || str(form, 'ageConfirm') !== '1') {
    redirect('/kayit?hata=VALIDATION_FAILED');
  }
  const { error, response } = await (
    await api()
  ).POST('/v1/auth/register', {
    body: {
      email: str(form, 'email'),
      password: str(form, 'password'),
      displayName: str(form, 'displayName'),
      ageConfirmed: true,
      termsVersion: TERMS_VERSION,
    },
  });
  if (response.status !== 202) redirect(`/kayit?hata=${problemCode(error)}`);
  redirect('/kayit?durum=gonderildi');
}

export async function logoutAction(): Promise<void> {
  const token = await getSessionToken();
  if (token) await (await api(token)).POST('/v1/auth/logout').catch(() => undefined);
  await clearSessionCookie();
  redirect('/');
}

export async function requestResetAction(form: FormData): Promise<void> {
  const { response, error } = await (
    await api()
  ).POST('/v1/auth/password-reset/request', {
    body: { email: str(form, 'email') },
  });
  if (response.status !== 202) redirect(`/parola-sifirla?hata=${problemCode(error)}`);
  redirect('/parola-sifirla?durum=gonderildi');
}

export async function confirmResetAction(form: FormData): Promise<void> {
  const token = str(form, 'token');
  const { response, error } = await (
    await api()
  ).POST('/v1/auth/password-reset/confirm', {
    body: { token, newPassword: str(form, 'newPassword') },
  });
  if (response.status !== 200) {
    redirect(`/parola-sifirla?token=${encodeURIComponent(token)}&hata=${problemCode(error)}`);
  }
  await clearSessionCookie();
  redirect('/parola-sifirla?durum=degisti');
}

export async function revokeSessionAction(form: FormData): Promise<void> {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  await (
    await api(token)
  ).DELETE('/v1/me/sessions/{id}', { params: { path: { id: str(form, 'id') } } });
  redirect('/hesabim');
}
