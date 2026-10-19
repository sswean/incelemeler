// E2E için izole veritabanı: her koşuda sıfırdan oluşturulur, migration + seed uygulanır.
// Playwright webServer'ları globalSetup'tan önce başlattığı için ayrı adımda çalışır.
import { execFileSync } from 'node:child_process';
import pg from 'pg';

const base = process.env.E2E_DB_BASE ?? 'postgresql://incelemeler:incelemeler_local_only@localhost:54320';
const admin = new pg.Client({ connectionString: `${base}/incelemeler` });
await admin.connect();
await admin.query('DROP DATABASE IF EXISTS incelemeler_e2e WITH (FORCE)');
await admin.query('CREATE DATABASE incelemeler_e2e');
await admin.end();

const apiDir = new URL('../../apps/api/', import.meta.url).pathname;
const env = { ...process.env, DATABASE_URL: `${base}/incelemeler_e2e`, APP_ENV: 'test' };
execFileSync('npx', ['prisma', 'migrate', 'deploy'], { cwd: apiDir, env, stdio: 'pipe' });
execFileSync('node', ['dist/seed/demo-seed.js'], { cwd: apiDir, env, stdio: 'inherit' });
console.log('E2E veritabanı hazır: incelemeler_e2e');
