import { describe, expect, it } from 'vitest';
import {
  base32Decode,
  base32Encode,
  decrypt,
  encrypt,
  ipPrefix,
  totpAt,
  verifyTotp,
} from './crypto.js';

// RFC 6238 Ek B test vektörleri (SHA1, anahtar "12345678901234567890", 8 hane).
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890'));

describe('[REQ-HSP-007] TOTP (RFC 6238)', () => {
  it.each([
    [59, '94287082'],
    [1111111109, '07081804'],
    [1111111111, '14050471'],
    [1234567890, '89005924'],
    [2000000000, '69279037'],
  ])('t=%i → %s', (t, expected) => {
    expect(totpAt(RFC_SECRET, BigInt(Math.floor(t / 30)), 8)).toBe(expected);
  });

  it('±1 adım tolerans ve yeniden oynatma koruması', () => {
    const now = 1_700_000_000_000;
    const step = BigInt(Math.floor(now / 30000));
    const code = totpAt(RFC_SECRET, step);
    expect(verifyTotp(RFC_SECRET, code, now, null)).toBe(step);
    expect(verifyTotp(RFC_SECRET, code, now + 30_000, null)).toBe(step);
    expect(verifyTotp(RFC_SECRET, code, now, step)).toBeNull();
    expect(verifyTotp(RFC_SECRET, '12345', now, null)).toBeNull();
  });

  it('base32 gidiş-dönüş', () => {
    const buf = Buffer.from([0, 1, 2, 250, 251, 255, 7]);
    expect(base32Decode(base32Encode(buf))).toEqual(buf);
  });
});

describe('[REQ-GUV-010] AES-256-GCM', () => {
  const key = 'a'.repeat(64);
  it('şifrele-çöz', () => {
    expect(decrypt(encrypt('gizli', key), key)).toBe('gizli');
  });
  it('değiştirilmiş veri reddedilir', () => {
    const enc = encrypt('gizli', key);
    const parts = enc.split('.');
    parts[3] = Buffer.from('baska').toString('base64url');
    expect(() => decrypt(parts.join('.'), key)).toThrow();
  });
});

describe('[REQ-KVK-025] IP kısaltma', () => {
  it('IPv4 /24 ve IPv6 /48', () => {
    expect(ipPrefix('203.0.113.77')).toBe('203.0.113.0/24');
    expect(ipPrefix('::ffff:198.51.100.9')).toBe('198.51.100.0/24');
    expect(ipPrefix('2001:db8:abcd:12::1')).toBe('2001:db8:abcd::/48');
    expect(ipPrefix(undefined)).toBeNull();
  });
});
