import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Problem, SearchResponse } from '@incelemeler/contracts';
import { SearchIndexerService } from '../src/modules/search/search-indexer.service.js';
import { seedDemoListings } from '../src/seed/demo-listings.js';
import { seedSearchDefaults } from '../src/seed/seed-search.js';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { nextIp } from './staff.js';

let t: TestContext;
const http = () => request(t.app.getHttpServer());

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  await seedSearchDefaults(t.prisma);
  await seedDemoListings(t.prisma);
  await t.app.get(SearchIndexerService).reindexAll();
}, 120_000);

afterAll(async () => {
  await t?.close();
});

describe('API sertleştirme (REQ-GUV-002/003/005/015)', () => {
  it('[REQ-GUV-005] her yanıtta güvenlik başlıkları; X-Powered-By yok', async () => {
    for (const res of [
      await http().get('/v1/health').expect(200),
      await http().get('/v1/yok-boyle-bir-yol').expect(404),
    ]) {
      expect(res.headers).toMatchObject({
        'x-content-type-options': 'nosniff',
        'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
        'referrer-policy': 'no-referrer',
        'cross-origin-resource-policy': 'same-site',
      });
      expect(res.headers['x-powered-by']).toBeUndefined();
    }
  });

  it('[REQ-GUV-002] bilinmeyen gövde alanı 422; bilinmeyen sorgu parametresi 400; aşırı büyük gövde 413', async () => {
    const res = await http()
      .post('/v1/data-requests')
      .set('X-Forwarded-For', nextIp())
      .send({
        type: 'ACCESS',
        email: 'guv@example.com',
        description: 'Hangi verilerimin işlendiğini öğrenmek istiyorum.',
        role: 'ADMIN',
      })
      .expect(422);
    const p = Problem.parse(res.body);
    expect(p.errors?.map((e) => e.code)).toContain('UNRECOGNIZED_KEYS');
    expect(await t.prisma.dataSubjectRequest.count()).toBe(0);
    await http().get('/v1/search').query({ q: 'simit', admin: '1' }).expect(400);
    const big = await http()
      .post('/v1/data-requests')
      .set({ 'X-Forwarded-For': nextIp(), 'Content-Type': 'application/json' })
      .send(JSON.stringify({ type: 'ACCESS', description: 'x'.repeat(200_000) }));
    expect(big.status).toBe(413);
    expect(big.headers['content-type']).toContain('application/problem+json');
    const malformed = await http()
      .post('/v1/data-requests')
      .set({ 'X-Forwarded-For': nextIp(), 'Content-Type': 'application/json' })
      .send('{"type": "ACCESS",');
    expect(malformed.status).toBe(400);
    expect(Problem.parse(malformed.body).code).toBe('VALIDATION_FAILED');
  });

  it('[REQ-GUV-003] SQL meta karakterleri veri olarak işlenir; sıralama alanı beyaz listeden', async () => {
    for (const q of ["' OR 1=1 --", 'simit"; DROP TABLE listings; --', "%' UNION SELECT 1 --"]) {
      const body = SearchResponse.parse(
        (await http().get('/v1/search').query({ q }).set('X-Forwarded-For', nextIp()).expect(200))
          .body,
      );
      expect(body.page).toBeDefined();
    }
    expect(await t.prisma.listing.count()).toBeGreaterThan(0);
    await http()
      .get('/v1/search')
      .query({ q: 'simit', sort: 'name; DROP TABLE listings' })
      .set('X-Forwarded-For', nextIp())
      .expect(422);
  });

  it('[REQ-GUV-015] hata gövdesi yalnızca problem alanlarını taşır', async () => {
    const res = await http()
      .get('/v1/categories')
      .query({ cursor: 'bozuk' })
      .expect((r) => expect(r.status).toBeGreaterThanOrEqual(400));
    expect(Object.keys(res.body as object).sort()).toEqual(
      expect.arrayContaining(['code', 'instance', 'status', 'title', 'traceId', 'type']),
    );
    expect(JSON.stringify(res.body)).not.toMatch(/stack|prisma|at \/|node_modules/i);
  });
});
