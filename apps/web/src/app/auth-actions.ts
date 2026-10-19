'use server';

import { redirect } from 'next/navigation';
import { api, clearSessionCookie, getSessionToken, setSessionCookie } from '../lib/session';
import { problemCode } from '../lib/errors';

const TERMS_VERSION = '2026-10-taslak';

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v : '';
}

export async function loginAction(form: FormData): Promise<void> {
  const { data, error } = await (
    await api()
  ).POST('/v1/auth/login', {
    body: { email: str(form, 'email'), password: str(form, 'password') },
  });
  if (!data) redirect(`/giris?hata=${problemCode(error)}`);
  await setSessionCookie(data.sessionToken, data.expiresAt);
  redirect('/hesabim');
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
