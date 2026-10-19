import type { INestApplication } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CategoryList, HealthStatus, Problem } from '@incelemeler/contracts';
import { createApp } from '../src/bootstrap.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { flattenTaxonomy } from '../src/seed/taxonomy.js';
import { startDatabase } from './postgres.js';

let container: StartedPostgreSqlContainer;
let app: INestApplication;
let prisma: PrismaClient;

beforeAll(async () => {
  const db = await startDatabase();
  container = db.container;
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: db.url }) });
  await seedTaxonomy(prisma);
  app = await createApp({
    APP_ENV: 'test',
    DATABASE_URL: db.url,
    API_PORT: 0,
    CURSOR_SECRET: 't'.repeat(32),
  });
  await app.init();
});

afterAll(async () => {
  await app?.close();
  await prisma?.$disconnect();
  await container?.stop();
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
