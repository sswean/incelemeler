import 'server-only';
import { cookies, headers } from 'next/headers';
import { createApiClient } from '@incelemeler/api-client';

/** Oturum çerezi (REQ-HSP-004): HttpOnly, Secure, SameSite=Lax, __Host- önekli. */
export const SESSION_COOKIE = '__Host-sid';

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function setSessionCookie(token: string, expiresAt: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiresAt),
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * Sunucu tarafında API istemcisi. Oturum token'ı Bearer olarak, istemci IP'si X-Forwarded-For ile iletilir
 * (API yalnızca güvenilen vekilden gelen başlığı dikkate alır).
 */
export async function api(token?: string | null) {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';
  const extra: Record<string, string> = {};
  if (token) extra['Authorization'] = `Bearer ${token}`;
  if (forwarded) extra['X-Forwarded-For'] = forwarded;
  return createApiClient(base, { headers: extra });
}

export async function currentUser() {
  const token = await getSessionToken();
  if (!token) return null;
  const { data } = await (await api(token)).GET('/v1/me').catch(() => ({ data: undefined }));
  return data ?? null;
}
