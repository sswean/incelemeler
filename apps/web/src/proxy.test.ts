import { describe, expect, it } from 'vitest';
import { maintenance } from './proxy';

describe('bakım modu sayfası', () => {
  it('[REQ-OPS-009] 503 + Retry-After, önbelleklenmez, indekslenmez', async () => {
    const res = maintenance();
    expect(res.status).toBe(503);
    expect(res.headers.get('Retry-After')).toBe('300');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const html = await res.text();
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).toContain('<h1>Kısa bir bakım çalışması yapıyoruz</h1>');
  });
});
