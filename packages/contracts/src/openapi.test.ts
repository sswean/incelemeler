import { describe, expect, it } from 'vitest';
import { buildOpenApiDocument } from './openapi.js';
import { endpoints } from './endpoints.js';

describe('[REQ-MIM-006] OpenAPI üretimi', () => {
  const doc = buildOpenApiDocument('test') as { paths: Record<string, Record<string, unknown>> };
  it('her sözleşme uç noktası belgede bulunur', () => {
    for (const ep of endpoints) {
      expect(doc.paths[ep.path]?.[ep.method]).toBeDefined();
    }
  });
  it('[REQ-MIM-007] tüm yollar /v1 önekli', () => {
    for (const p of Object.keys(doc.paths)) expect(p.startsWith('/v1/')).toBe(true);
  });
  it('[REQ-MIM-010] her işlem problem+json varsayılan yanıtı taşır', () => {
    for (const item of Object.values(doc.paths)) {
      for (const op of Object.values(item) as Array<{ responses: Record<string, unknown> }>) {
        expect(op.responses['default']).toBeDefined();
      }
    }
  });
  it('[REQ-MIM-009] sponsorlu sıralama parametresi yoktur', () => {
    expect(JSON.stringify(doc).toLowerCase()).not.toContain('sponsor');
  });
});
