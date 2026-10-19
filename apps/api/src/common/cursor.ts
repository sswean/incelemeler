import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * İmzalı, opak cursor (REQ-MIM-008). İçerik: sıralama anahtarı + benzersiz id.
 * İmza doğrulanamayan cursor reddedilir (istemci cursor'ı değiştiremez).
 */
export interface CursorPayload {
  k: Array<string | number>;
  id: string;
}

export class InvalidCursorError extends Error {}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

export function encodeCursor(payload: CursorPayload, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${data}.${sign(data, secret)}`;
}

export function decodeCursor(cursor: string, secret: string): CursorPayload {
  const [data, sig] = cursor.split('.');
  if (!data || !sig) throw new InvalidCursorError('Cursor biçimi geçersiz');
  const expected = Buffer.from(sign(data, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    throw new InvalidCursorError('Cursor imzası geçersiz');
  }
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as CursorPayload;
    if (!Array.isArray(parsed.k) || typeof parsed.id !== 'string') throw new Error('shape');
    return parsed;
  } catch {
    throw new InvalidCursorError('Cursor içeriği geçersiz');
  }
}
