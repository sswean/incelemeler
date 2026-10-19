import type { INestApplication } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { createApp } from '../src/bootstrap.js';
import { EnvSchema, type Env } from '../src/config/env.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { MemoryEmailAdapter } from '../src/modules/notifications/email.port.js';
import { MemoryStorageAdapter } from '../src/modules/media/storage.port.js';
import { startDatabase } from './postgres.js';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaClient;
  mail: MemoryEmailAdapter;
  storage: MemoryStorageAdapter;
  env: Env;
  container: StartedPostgreSqlContainer;
  close(): Promise<void>;
}

/** Gerçek PostGIS konteyneri + migration'lar + bellek e-posta adaptörüyle API. */
export async function startTestApp(
  extra: Partial<Record<keyof Env, string>> = {},
): Promise<TestContext> {
  const { container, url } = await startDatabase();
  const env = EnvSchema.parse({
    APP_ENV: 'test',
    DATABASE_URL: url,
    API_PORT: '0',
    CURSOR_SECRET: 't'.repeat(32),
    DATA_ENCRYPTION_KEY: 'b'.repeat(64),
    EMAIL_ADAPTER: 'memory',
    STORAGE_ADAPTER: 'memory',
    // Senaryolar tek IP'den yoğun istek yapar; rota sınıfı sınırları security.int'te çarpan 1 ile sınanır.
    RATE_LIMIT_MULTIPLIER: '100',
    ...extra,
  });
  const mail = new MemoryEmailAdapter();
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  const storage = new MemoryStorageAdapter();
  const app = await createApp(env, { emailPort: mail, storagePort: storage });
  await app.init();
  return {
    app,
    prisma,
    mail,
    storage,
    env,
    container,
    async close() {
      await app.close();
      await prisma.$disconnect();
      await container.stop();
    },
  };
}

/** E-posta metnindeki bağlantıdan token'ı çıkarır. */
export function tokenFromMail(text: string): string {
  const m = /token=([A-Za-z0-9_%-]+)/.exec(text);
  if (!m?.[1]) throw new Error('E-postada token yok');
  return decodeURIComponent(m[1]);
}
