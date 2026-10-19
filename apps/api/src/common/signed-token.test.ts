import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from './signed-token.js';

describe('[REQ-ICR-005] imzalı, süreli önizleme belirteci', () => {
  const secret = 's'.repeat(32);
  it('geçerli belirteç doğrulanır; başka amaçta ve değiştirilince geçmez', () => {
    const { token } = signToken({ articleId: 'a1' }, secret, 'preview', 60_000);
    expect(verifyToken(token, secret, 'preview')).toMatchObject({ articleId: 'a1' });
    expect(verifyToken(token, secret, 'other')).toBeNull();
    const [data, sig] = token.split('.');
    const tampered = Buffer.from(
      JSON.stringify({ articleId: 'a2', exp: Date.now() + 1e6 }),
    ).toString('base64url');
    expect(verifyToken(`${tampered}.${sig}`, secret, 'preview')).toBeNull();
    expect(verifyToken(`${data}.x`, secret, 'preview')).toBeNull();
  });
  it('süresi dolan belirteç geçmez', () => {
    const { token } = signToken({ articleId: 'a1' }, secret, 'preview', -1);
    expect(verifyToken(token, secret, 'preview')).toBeNull();
  });
});
