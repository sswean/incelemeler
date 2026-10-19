import { describe, expect, it } from 'vitest';
import { landingSource } from './analytics-client';

describe('[REQ-ANL-004] giriş kaynağı sınıflaması (yönlendiren adres saklanmaz)', () => {
  it.each([
    ['', 'direct'],
    ['https://www.google.com.tr/', 'search'],
    ['https://yandex.com.tr/search?text=x', 'search'],
    ['https://l.instagram.com/', 'social'],
    ['https://incelemeler.example/ara', 'internal'],
    ['https://blog.example/yazi', 'other'],
    ['bozuk', 'other'],
  ])('%s → %s', (ref, source) => {
    expect(landingSource(ref, 'incelemeler.example')).toBe(source);
  });
});
