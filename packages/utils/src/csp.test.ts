import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy, createNonce } from './csp.js';

describe('[REQ-GUV-005] içerik güvenlik politikası', () => {
  it('nonce zorunlu, çerçeveleme yasak, eklenti yok; üretimde eval yok', () => {
    const csp = contentSecurityPolicy('abc');
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain('unsafe-eval');
    expect(contentSecurityPolicy('abc', { dev: true })).toContain("'unsafe-eval'");
  });
  it('nonce her çağrıda farklı ve base64', () => {
    const a = createNonce();
    expect(a).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(createNonce()).not.toBe(a);
  });
});
