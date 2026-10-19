import { describe, expect, it } from 'vitest';
import { decodeCursor, encodeCursor, InvalidCursorError } from './cursor.js';

const secret = 's'.repeat(32);

describe('[REQ-MIM-008] imzalı cursor', () => {
  it('kodla-çöz gidiş dönüşü', () => {
    const c = encodeCursor({ k: [3], id: 'abc' }, secret);
    expect(decodeCursor(c, secret)).toEqual({ k: [3], id: 'abc' });
  });
  it('değiştirilmiş cursor reddedilir', () => {
    const c = encodeCursor({ k: [3], id: 'abc' }, secret);
    const [, sig] = c.split('.');
    const forged = `${Buffer.from(JSON.stringify({ k: [0], id: 'zzz' })).toString('base64url')}.${sig}`;
    expect(() => decodeCursor(forged, secret)).toThrow(InvalidCursorError);
  });
  it('başka gizli anahtarla imzalanan cursor reddedilir', () => {
    const c = encodeCursor({ k: [1], id: 'x' }, 'o'.repeat(32));
    expect(() => decodeCursor(c, secret)).toThrow(InvalidCursorError);
  });
  it('bozuk biçim reddedilir', () => {
    expect(() => decodeCursor('bozuk', secret)).toThrow(InvalidCursorError);
  });
});
