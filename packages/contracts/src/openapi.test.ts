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
    // (1) Hiçbir uç noktada sıralama parametresi sponsorluk değeri kabul etmez ve hiçbir parametrenin adı
    //     sponsorluk içermez. (2) Herkese açık (panel dışı) uç noktaların sorgu parametrelerinde sponsorluk
    //     hiç geçmez. Panelde içerik türü filtresi (tür = Sponsorlu içerik) bir sıralama değildir.
    const paths = (doc as { paths: Record<string, Record<string, { parameters?: unknown[] }>> })
      .paths;
    let checked = 0;
    for (const [path, item] of Object.entries(paths)) {
      for (const op of Object.values(item)) {
        for (const p of (op.parameters ?? []) as Array<{ in: string; name: string }>) {
          if (p.in !== 'query') continue;
          checked++;
          expect(p.name.toLowerCase(), path).not.toContain('sponsor');
          if (/sort|sira|order/i.test(p.name) || !path.startsWith('/v1/admin/')) {
            expect(JSON.stringify(p).toLowerCase(), `${path} ${p.name}`).not.toContain('sponsor');
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('[REQ-MIM-006] OpenAPI referans bütünlüğü', () => {
  it('her $ref components/schemas altında tanımlı', () => {
    const doc = buildOpenApiDocument('test') as {
      components: { schemas: Record<string, unknown> };
    };
    const refs = [
      ...JSON.stringify(doc).matchAll(/"\$ref":"#\/components\/schemas\/([^"]+)"/g),
    ].map((m) => m[1]);
    expect(refs.length).toBeGreaterThan(0);
    for (const r of refs) expect(doc.components.schemas[r as string]).toBeDefined();
  });
});
