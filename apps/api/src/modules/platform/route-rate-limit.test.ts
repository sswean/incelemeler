import { describe, expect, it } from 'vitest';
import { routeClass } from './route-rate-limit.js';

describe('rota sınıfları', () => {
  it('[REQ-GUV-009] kimlik, yazma, arama, yönlendirme ve panel ayrı sınıflardır; önbellekli okumalar sınıfsız', () => {
    expect(routeClass('POST', '/v1/auth/login')).toBe('auth');
    expect(routeClass('GET', '/v1/admin/campaigns')).toBe('panel');
    expect(routeClass('POST', '/v1/admin/campaigns')).toBe('panel');
    expect(routeClass('GET', '/v1/search')).toBe('search');
    expect(routeClass('GET', '/v1/search/suggest')).toBe('search');
    expect(routeClass('GET', '/v1/outbound/abc/resolve')).toBe('redirect');
    expect(routeClass('GET', '/v1/sponsored/abc/click')).toBe('redirect');
    expect(routeClass('POST', '/v1/reviews')).toBe('write');
    expect(routeClass('DELETE', '/v1/me/favorites/x')).toBe('write');
    expect(routeClass('GET', '/v1/listings/ornek')).toBeNull();
    expect(routeClass('GET', '/v1/health')).toBeNull();
  });
});
