import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Amaç kapsamlı, süreli imzalı belirteç (ör. içerik önizleme bağlantısı — REQ-ICR-005).
 * Anahtar ana sırdan amaçla türetilir; bir amacın belirteci diğerinde geçmez.
 */
function key(secret: string, purpose: string): Buffer {
  return createHmac('sha256', secret).update(`purpose:${purpose}`).digest();
}

export function signToken(
  payload: Record<string, unknown>,
  secret: string,
  purpose: string,
  ttlMs: number,
) {
  const exp = Date.now() + ttlMs;
  const data = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const sig = createHmac('sha256', key(secret, purpose)).update(data).digest('base64url');
  return { token: `${data}.${sig}`, expiresAt: new Date(exp) };
}

export function verifyToken<T extends Record<string, unknown>>(
  token: string,
  secret: string,
  purpose: string,
): T | null {
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = Buffer.from(
    createHmac('sha256', key(secret, purpose)).update(data).digest('base64url'),
  );
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as T & {
      exp: number;
    };
    return typeof parsed.exp === 'number' && parsed.exp > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}
