import { describe, expect, it } from 'vitest';
import { checkPassword, hashPassword, verifyPassword } from './password.js';

describe('[REQ-HSP-003] parola politikası ve Argon2id', () => {
  it('kısa, yaygın ve e-postayı içeren parolalar reddedilir', () => {
    expect(checkPassword('kisa123')).toBe('TOO_SHORT');
    expect(checkPassword('Galatasaray')).toBe('TOO_COMMON');
    expect(checkPassword('ayse.yilmaz-2026!', 'ayse.yilmaz@example.com')).toBe('CONTAINS_EMAIL');
    expect(checkPassword('x'.repeat(129))).toBe('TOO_LONG');
    expect(checkPassword('Uzun-ve-Benzersiz-Parola-42')).toBeNull();
  });

  it('Argon2id karması doğrulanır, yanlış parola reddedilir', async () => {
    const h = await hashPassword('Uzun-ve-Benzersiz-Parola-42');
    expect(h.startsWith('$argon2id$')).toBe(true);
    expect(h).toContain('m=19456,t=2,p=1');
    expect(await verifyPassword(h, 'Uzun-ve-Benzersiz-Parola-42')).toBe(true);
    expect(await verifyPassword(h, 'yanlis-parola-0000')).toBe(false);
    expect(await verifyPassword('bozuk', 'x')).toBe(false);
  });
});
