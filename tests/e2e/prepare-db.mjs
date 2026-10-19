// E2E için izole veritabanı: her koşuda sıfırdan oluşturulur, migration + seed uygulanır.
// Playwright webServer'ları globalSetup'tan önce başlattığı için ayrı adımda çalışır.
import { execFileSync } from 'node:child_process';
import pg from 'pg';

const base =
  process.env.E2E_DB_BASE ?? 'postgresql://incelemeler:incelemeler_local_only@localhost:54320';
// env.ts ile aynı değerler (bu betik TypeScript'i doğrudan içe aktarmaz).
const STAFF_PASSWORD = 'e2e-panel-test-parolasi-yalnizca-yerel';
const PROJECTS = ['mobile-390', 'desktop-1280'];
const staffEmail = (project) => `e2e-personel-${project}@example.test`;

const admin = new pg.Client({ connectionString: `${base}/incelemeler` });
await admin.connect();
await admin.query('DROP DATABASE IF EXISTS incelemeler_e2e WITH (FORCE)');
await admin.query('CREATE DATABASE incelemeler_e2e');
await admin.end();

const apiDir = new URL('../../apps/api/', import.meta.url).pathname;
const databaseUrl = `${base}/incelemeler_e2e`;
const env = { ...process.env, DATABASE_URL: databaseUrl, APP_ENV: 'test' };
execFileSync('npx', ['prisma', 'migrate', 'deploy'], { cwd: apiDir, env, stdio: 'pipe' });
execFileSync('node', ['dist/seed/demo-seed.js'], { cwd: apiDir, env, stdio: 'inherit' });

// Personel: ilki gerçek CLI ile (SUPER_ADMIN), diğer proje için aynı parola özetiyle ADMIN kopyası.
execFileSync('node', ['dist/cli/create-super-admin.js'], {
  cwd: apiDir,
  env: {
    ...env,
    ADMIN_EMAIL: staffEmail(PROJECTS[0]),
    ADMIN_PASSWORD: STAFF_PASSWORD,
    ADMIN_NAME: 'E2E Yönetici',
  },
  stdio: 'inherit',
});
const db = new pg.Client({ connectionString: databaseUrl });
await db.connect();
for (const project of PROJECTS.slice(1)) {
  const { rows } = await db.query(
    `INSERT INTO users (id, email, email_verified_at, password_hash, display_name, age_confirmed_at, terms_version, updated_at)
     SELECT gen_random_uuid(), $1, now(), password_hash, 'E2E Yönetici 2', now(), 'staff-bootstrap', now()
     FROM users WHERE email = $2 RETURNING id`,
    [staffEmail(project), staffEmail(PROJECTS[0])],
  );
  await db.query(`INSERT INTO staff_roles (user_id, role) VALUES ($1, 'ADMIN')`, [rows[0].id]);
}
await db.end();
console.log('E2E veritabanı hazır: incelemeler_e2e');
