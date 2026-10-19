import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'prisma/config';

// Prisma 7 .env dosyasını kendiliğinden yüklemez; yerelde kök .env okunur (varsa).
const rootEnv = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(rootEnv) && !process.env.DATABASE_URL) process.loadEnvFile(rootEnv);

// Bağlantı adresi şemada değil, burada ortam değişkeninden okunur.
// `prisma generate` adres gerektirmez; migrate komutları gerektirir.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Migration'lar şema sahibi rolüyle; uygulama en az yetkili rolle çalışır (REQ-GUV-011).
  datasource: { url: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL ?? '' },
});
