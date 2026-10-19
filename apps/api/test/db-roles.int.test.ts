import type { INestApplication } from '@nestjs/common';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/bootstrap.js';
import { EnvSchema } from '../src/config/env.js';
import { APP_ROLE, applyDbRoles, READONLY_ROLE } from '../src/db/roles.js';
import { MemoryEmailAdapter } from '../src/modules/notifications/email.port.js';
import { MemoryStorageAdapter } from '../src/modules/media/storage.port.js';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { startDatabase } from './postgres.js';
import { nextIp, STAFF_PASSWORD } from './staff.js';

// Yalnızca bu test konteyneri için (gerçek sır değil).
const PASSWORDS = { app: 'test-app-role-only-local', readonly: 'test-readonly-only-local' };
let container: StartedPostgreSqlContainer;
const urlFor = (user: string, password: string) =>
  `postgresql://${user}:${password}@${container.getHost()}:${container.getPort()}/${container.getDatabase()}`;
const asRole = async (user: string, password: string) => {
  const c = new pg.Client({ connectionString: urlFor(user, password) });
  await c.connect();
  return c;
};
const denied = (p: Promise<unknown>) =>
  expect(p).rejects.toMatchObject({ code: expect.stringMatching(/^(42501|42P01)$/) });

beforeAll(async () => {
  ({ container } = await startDatabase());
  const owner = new pg.Client({ connectionString: container.getConnectionUri() });
  await owner.connect();
  await applyDbRoles(owner, PASSWORDS);
  // İdempotent: ikinci çalıştırma parolayı günceller, hata vermez.
  await applyDbRoles(owner, PASSWORDS);
  await owner.end();
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: container.getConnectionUri() }),
  });
  await seedTaxonomy(prisma);
  await prisma.$disconnect();
}, 120_000);

afterAll(async () => {
  await container?.stop();
});

describe('veritabanı rolleri (REQ-GUV-011)', () => {
  it('[REQ-GUV-011] uygulama rolü: veri okur/yazar; DDL yok; audit_log yalnızca INSERT; migration tablosu salt okunur', async () => {
    const app = await asRole(APP_ROLE, PASSWORDS.app);
    try {
      await app.query('SELECT count(*) FROM categories');
      await app.query(
        `INSERT INTO audit_log (id, action, target_type) VALUES (gen_random_uuid(), 'rol.test', 'test')`,
      );
      await denied(app.query(`UPDATE audit_log SET action = 'x'`));
      await denied(app.query('DELETE FROM audit_log'));
      await denied(app.query('TRUNCATE audit_log'));
      await denied(app.query('CREATE TABLE kotu (id int)'));
      await expect(app.query('DROP TABLE categories')).rejects.toBeDefined();
      await expect(app.query('ALTER TABLE categories ADD COLUMN x int')).rejects.toBeDefined();
      await denied(app.query(`DELETE FROM _prisma_migrations`));
      const sup = await app.query<{ rolsuper: boolean; rolcreaterole: boolean }>(
        'SELECT rolsuper, rolcreaterole FROM pg_roles WHERE rolname = current_user',
      );
      expect(sup.rows[0]).toEqual({ rolsuper: false, rolcreaterole: false });
    } finally {
      await app.end();
    }
  });

  it('[REQ-GUV-011] raporlama rolü salt okunur', async () => {
    const ro = await asRole(READONLY_ROLE, PASSWORDS.readonly);
    try {
      await ro.query('SELECT count(*) FROM categories');
      await denied(ro.query(`UPDATE categories SET name = name`));
      await denied(
        ro.query(
          `INSERT INTO audit_log (id, action, target_type) VALUES (gen_random_uuid(), 'x', 'x')`,
        ),
      );
    } finally {
      await ro.end();
    }
  });

  it('[REQ-GUV-011] API uygulama rolüyle çalışır: okuma, kayıt (yazma) ve denetim kaydı', async () => {
    const env = EnvSchema.parse({
      APP_ENV: 'test',
      DATABASE_URL: urlFor(APP_ROLE, PASSWORDS.app),
      API_PORT: '0',
      CURSOR_SECRET: 't'.repeat(32),
      DATA_ENCRYPTION_KEY: 'b'.repeat(64),
      EMAIL_ADAPTER: 'memory',
      STORAGE_ADAPTER: 'memory',
    });
    const nest: INestApplication = await createApp(env, {
      emailPort: new MemoryEmailAdapter(),
      storagePort: new MemoryStorageAdapter(),
    });
    await nest.init();
    try {
      const http = () => request(nest.getHttpServer());
      await http().get('/v1/health').expect(200);
      await http().get('/v1/categories').expect(200);
      await http()
        .post('/v1/auth/register')
        .set('X-Forwarded-For', nextIp())
        .send({
          email: 'rol-testi@example.com',
          password: STAFF_PASSWORD,
          displayName: 'Rol Testi',
          ageConfirmed: true,
          termsVersion: '2026-10-taslak',
        })
        .expect(202);
    } finally {
      await nest.close();
    }
  });
});
