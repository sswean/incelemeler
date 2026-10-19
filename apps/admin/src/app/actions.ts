'use server';

import { redirect } from 'next/navigation';
import { problemCode } from '../lib/errors';
import {
  api,
  clearSessionCookie,
  getSessionToken,
  pathForMfa,
  setSessionCookie,
} from '../lib/session';

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

export async function loginAction(form: FormData): Promise<void> {
  const client = await api();
  const { data, error } = await client.POST('/v1/auth/login', {
    body: { email: str(form, 'email'), password: (form.get('password') as string | null) ?? '' },
  });
  if (!data) redirect(`/giris?hata=${problemCode(error)}`);
  if (data.user.roles.length === 0) {
    // Personel olmayan hesap panel oturumu açamaz; açılan oturum hemen kapatılır.
    await (await api(data.sessionToken)).POST('/v1/auth/logout');
    redirect('/giris?hata=FORBIDDEN');
  }
  await setSessionCookie(data.sessionToken, data.expiresAt);
  redirect(pathForMfa(data.user.mfa));
}

export async function logoutAction(): Promise<void> {
  const token = await getSessionToken();
  if (token) await (await api(token)).POST('/v1/auth/logout').catch(() => undefined);
  await clearSessionCookie();
  redirect('/giris');
}

export type MfaSetupState = { error?: string; recoveryCodes?: string[] };

/** 2FA kurulumunu onaylar; kurtarma kodları yalnızca bu yanıtta bir kez gösterilir. */
export async function mfaConfirmAction(
  _prev: MfaSetupState,
  form: FormData,
): Promise<MfaSetupState> {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  const { data, error } = await (
    await api(token)
  ).POST('/v1/auth/mfa/confirm', { body: { code: str(form, 'code') } });
  if (!data) return { error: problemCode(error) };
  return { recoveryCodes: data.recoveryCodes };
}

export async function mfaVerifyAction(form: FormData): Promise<void> {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  const { data, error } = await (
    await api(token)
  ).POST('/v1/auth/mfa/verify', { body: { code: str(form, 'code').toLowerCase() } });
  if (!data) redirect(`/iki-adim?hata=${problemCode(error)}`);
  redirect('/');
}
