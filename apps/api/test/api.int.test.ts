import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CategoryList, HealthStatus, Problem } from '@incelemeler/contracts';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { flattenTaxonomy } from '../src/seed/taxonomy.js';
import { startTestApp, type TestContext } from './app.js';

let t: TestContext;
let app: INestApplication;
let prisma: PrismaClient;

beforeAll(async () => {
  t = await startTestApp();
  app = t.app;
  prisma = t.prisma;
  await seedTaxonomy(prisma);
});

afterAll(async () => {
  await t?.close();
});

describe('yürüyen iskelet: API ↔ PostgreSQL', () => {
  it('[REQ-MIM-007] GET /v1/health veritabanını gerçekten sorgular', async () => {
    const res = await request(app.getHttpServer()).get('/v1/health').expect(200);
    const body = HealthStatus.parse(res.body);
    expect(body.database).toBe('up');
    expect(res.headers['x-trace-id']).toMatch(/^[0-9a-f]{32}$/);
  });

  it('[REQ-MIM-008] kategoriler cursor ile eksiksiz ve tekrarsız sayfalanır', async () => {
    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const res = await request(app.getHttpServer())
        .get('/v1/categories')
        .query({ limit: 7, ...(cursor ? { cursor } : {}) })
        .expect(200);
      const body = CategoryList.parse(res.body);
      expect(body.data.length).toBeLessThanOrEqual(7);
      seen.push(...body.data.map((c) => c.slug));
      cursor = body.page.nextCursor;
      pages++;
    } while (cursor && pages < 50);
    expect(seen.length).toBe(flattenTaxonomy().length);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('[REQ-MIM-008] değiştirilmiş cursor 400 problem+json döner', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/categories')
      .query({ cursor: 'eyJrIjpbMF0sImlkIjoieCJ9.sahte' })
      .expect(400);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(Problem.parse(res.body).code).toBe('VALIDATION_FAILED');
  });

  it('[REQ-MIM-009] bilinmeyen sorgu parametresi 400 döner', async () => {
    const res = await request(app.getHttpServer()).get('/v1/categories?sponsored=1').expect(400);
    expect(Problem.parse(res.body).errors?.[0]?.code).toBe('UNKNOWN_PARAMETER');
  });

  it('[REQ-MIM-010] geçersiz değer 422, yanıt iç bilgi sızdırmaz', async () => {
    const res = await request(app.getHttpServer()).get('/v1/categories?limit=1000').expect(422);
    const p = Problem.parse(res.body);
    expect(p.traceId).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toMatch(/at \w+ \(|prisma|SELECT/i);
  });

  it('[REQ-MIM-010] bilinmeyen yol 404 problem+json', async () => {
    const res = await request(app.getHttpServer()).get('/v1/yok').expect(404);
    expect(Problem.parse(res.body).code).toBe('NOT_FOUND');
  });

  it('yalnızca PUBLISHED kategoriler döner', async () => {
    await prisma.category.create({
      data: { slug: 'gizli-test', name: 'Gizli Test', allowedKinds: ['PLACE'], status: 'HIDDEN' },
    });
    const res = await request(app.getHttpServer()).get('/v1/categories?limit=100').expect(200);
    expect(CategoryList.parse(res.body).data.map((c) => c.slug)).not.toContain('gizli-test');
  });

  it('[REQ-VER-017] audit_log güncellenemez ve silinemez', async () => {
    const row = await prisma.auditLog.create({
      data: { action: 'test.insert', targetType: 'test' },
    });
    await expect(
      prisma.auditLog.update({ where: { id: row.id }, data: { action: 'degisti' } }),
    ).rejects.toThrow();
    await expect(prisma.auditLog.delete({ where: { id: row.id } })).rejects.toThrow();
  });

  it('[REQ-VER-025] kategori ağacında ebeveyn silinemez (ON DELETE RESTRICT)', async () => {
    const parent = await prisma.category.findUniqueOrThrow({ where: { slug: 'konaklama' } });
    await expect(prisma.category.delete({ where: { id: parent.id } })).rejects.toThrow();
  });
});

describe('[REQ-VER-001] listeleme ortak tablosu', () => {
  const base = async () => {
    const cat = await prisma.category.findUniqueOrThrow({ where: { slug: 'kahvalti-mekanlari' } });
    return {
      kind: 'PLACE' as const,
      primaryCategoryId: cat.id,
      dataOrigin: 'DEMO' as const,
      source: 'test',
    };
  };

  it('ortak alanlarla listeleme oluşturulur; attributes varsayılanı boş nesne', async () => {
    const l = await prisma.listing.create({
      data: {
        ...(await base()),
        slug: 'ornek-kahvalti-evi-demo',
        name: 'Örnek Kahvaltı Evi (Demo)',
      },
    });
    expect(l.status).toBe('DRAFT');
    expect(l.attributes).toEqual({});
    expect(l.version).toBe(1);
  });

  it('[REQ-VER-011] fiyat seviyesi 1–4 dışında reddedilir', async () => {
    await expect(
      prisma.listing.create({
        data: { ...(await base()), slug: 'fiyat-5', name: 'Fiyat 5 (Demo)', priceLevel: 5 },
      }),
    ).rejects.toThrow();
  });

  it('yayın tarihi olmadan PUBLISHED olamaz', async () => {
    await expect(
      prisma.listing.create({
        data: { ...(await base()), slug: 'tarihsiz', name: 'Tarihsiz (Demo)', status: 'PUBLISHED' },
      }),
    ).rejects.toThrow();
  });

  it('[REQ-VER-025] listelemesi olan kategori silinemez', async () => {
    const cat = await prisma.category.findUniqueOrThrow({ where: { slug: 'kahvalti-mekanlari' } });
    await expect(prisma.category.delete({ where: { id: cat.id } })).rejects.toThrow();
  });
});
