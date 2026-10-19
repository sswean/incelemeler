import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createApiClient } from '@incelemeler/api-client';

/** Panel oturum çerezi: kamu sitesinden ayrı ad; HttpOnly, Secure, SameSite=Strict. */
export const ADMIN_SESSION_COOKIE = '__Host-asid';

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value ?? null;
}

export async function setSessionCookie(token: string, expiresAt: string): Promise<void> {
  (await cookies()).set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    expires: new Date(expiresAt),
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
}

/** Sunucu tarafında API istemcisi (panel veritabanına doğrudan bağlanmaz — REQ-MIM-001). */
export async function api(token?: string | null) {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';
  const extra: Record<string, string> = {};
  if (token) extra['Authorization'] = `Bearer ${token}`;
  if (forwarded) extra['X-Forwarded-For'] = forwarded;
  return createApiClient(base, { headers: extra });
}

/** MFA durumuna göre panelde gidilecek yer. */
export function pathForMfa(mfa: string): string {
  if (mfa === 'SETUP_REQUIRED') return '/iki-adim/kurulum';
  if (mfa === 'VERIFY_REQUIRED') return '/iki-adim';
  return '/';
}

/**
 * Panel sayfaları için koruma (REQ-HSP-007): 2FA doğrulanmış personel oturumu yoksa
 * giriş ya da 2FA adımına yönlendirir.
 */
export async function requireStaff() {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  const client = await api(token);
  const { data, error } = await client.GET('/v1/admin/me');
  if (data) return { token, user: data };
  if (error?.code === 'MFA_REQUIRED') {
    const { data: me } = await client.GET('/v1/me');
    if (me) redirect(pathForMfa(me.mfa));
  }
  redirect(error?.code === 'FORBIDDEN' ? '/giris?hata=FORBIDDEN' : '/giris');
}
