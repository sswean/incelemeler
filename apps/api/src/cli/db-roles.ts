import pg from 'pg';
import { APP_ROLE, applyDbRoles, READONLY_ROLE } from '../db/roles.js';

/**
 * En az yetkili veritabanı rollerini kurar/günceller (REQ-GUV-011):
 * `MIGRATION_DATABASE_URL=… APP_DB_PASSWORD=… READONLY_DB_PASSWORD=… pnpm --filter @incelemeler/api db:roles`
 * Bağlantı şema sahibi (migration) rolüyle yapılır; parolalar ortamdan gelir ve yazdırılmaz.
 */
const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
const app = process.env.APP_DB_PASSWORD;
const readonly = process.env.READONLY_DB_PASSWORD;
if (!url || !app || !readonly) {
  console.error(
    'MIGRATION_DATABASE_URL (ya da DATABASE_URL), APP_DB_PASSWORD ve READONLY_DB_PASSWORD gerekli',
  );
  process.exit(1);
}
const db = new pg.Client({ connectionString: url });
await db.connect();
try {
  await applyDbRoles(db, { app, readonly });
  console.warn(`[db] roller hazır: ${APP_ROLE} (uygulama), ${READONLY_ROLE} (salt okunur)`);
} finally {
  await db.end();
}
