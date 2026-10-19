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
const extraStaff = [
  ...PROJECTS.slice(1).map((p) => [staffEmail(p), 'E2E Yönetici 2']),
  ...PROJECTS.map((p) => [`e2e-taksonomi-${p}@example.test`, 'E2E Taksonomi']),
  ...PROJECTS.map((p) => [`e2e-katalog-${p}@example.test`, 'E2E Katalog']),
  ...PROJECTS.map((p) => [`e2e-katalog2-${p}@example.test`, 'E2E Katalog 2']),
  ...PROJECTS.map((p) => [`e2e-aktarim-${p}@example.test`, 'E2E Aktarım']),
  ...PROJECTS.map((p) => [`e2e-yazar-${p}@example.test`, 'E2E Yazar', 'AUTHOR']),
  ...PROJECTS.map((p) => [`e2e-editor-${p}@example.test`, 'E2E Editör', 'EDITOR']),
  ...PROJECTS.map((p) => [`e2e-esik-${p}@example.test`, 'E2E Eşik']),
  ...PROJECTS.map((p) => [`e2e-moderator-${p}@example.test`, 'E2E Moderatör', 'MODERATOR']),
];
for (const [email, name, role = 'ADMIN'] of extraStaff) {
  const { rows } = await db.query(
    `INSERT INTO users (id, email, email_verified_at, password_hash, display_name, age_confirmed_at, terms_version, updated_at)
     SELECT gen_random_uuid(), $1, now(), password_hash, $3, now(), 'staff-bootstrap', now()
     FROM users WHERE email = $2 RETURNING id`,
    [email, staffEmail(PROJECTS[0]), name],
  );
  await db.query(`INSERT INTO staff_roles (user_id, role) VALUES ($1, $2)`, [rows[0].id, role]);
}
// Üyeler (doğrulanmış e-posta, personel rolü yok) — değerlendirme akışı.
for (const p of PROJECTS) {
  await db.query(
    `INSERT INTO users (id, email, email_verified_at, password_hash, display_name, age_confirmed_at, terms_version, created_at, updated_at)
     SELECT gen_random_uuid(), $1, now(), password_hash, $3, now(), 'test', now() - interval '400 days', now()
     FROM users WHERE email = $2`,
    [`e2e-uye-${p}@example.test`, staffEmail(PROJECTS[0]), `Deneyimli Gezgin ${p}`],
  );
}
// REQ-KAT-004 / E2E-020: yalnızca test ortamında yüklenen hukuki kapı fikstürü (DEMO listelemeler için).
await db.query(
  `INSERT INTO legal_approvals (id, category_id, approved_by, note)
   SELECT gen_random_uuid(), id, 'TEST-FIXTURE', 'E2E test fikstürü — üretimde geçersiz' FROM categories WHERE slug = 'konaklama'`,
);
// SEO/detay sayfası E2E fikstürleri: yalnızca bu atılan veritabanında, açıkça kurgusal adlarla.
const area = async (sql, args) => (await db.query(sql, args)).rows[0].id;
const istanbul = await area(`SELECT id FROM admin_areas WHERE level = 'PROVINCE' AND code = '34'`);
const kadikoy = await area(`SELECT id FROM admin_areas WHERE parent_id = $1 AND slug = 'kadikoy'`, [
  istanbul,
]);
const restoranlar = await area(`SELECT id FROM categories WHERE slug = 'restoranlar'`);
async function fixtureListing(slug, name, extra = {}) {
  const { rows } = await db.query(
    `INSERT INTO listings (id, kind, slug, name, short_description, primary_category_id, status, published_at,
       data_origin, source, source_verified_at, contacts, price_level, deleted_at, updated_at, attribute_schema_version)
     VALUES (gen_random_uuid(), 'PLACE', $1, $2, $3, $4, $5, now(), $6, 'E2E test fikstürü',
       now() - interval '200 days', $7, 2, $8, now(), 0) RETURNING id`,
    [
      slug,
      name,
      extra.short ?? null,
      restoranlar,
      extra.status ?? 'PUBLISHED',
      extra.origin ?? 'EDITORIAL',
      JSON.stringify({ phone: '+90 216 000 00 00', website: 'https://ornek.example' }),
      extra.deleted ? new Date() : null,
    ],
  );
  await db.query(
    `INSERT INTO listing_locations (listing_id, province_id, district_id, address_line, postal_code, latitude, longitude)
     VALUES ($1, $2, $3, 'Örnek Sokak No: 1', '34710', 40.990100, 29.028900)`,
    [rows[0].id, istanbul, kadikoy],
  );
  return rows[0].id;
}
const e2eListing = await fixtureListing('e2e-test-lokantasi', 'E2E Test Lokantası', {
  short: 'Uçtan uca testler için kurgusal bir lokanta kaydı.',
});
await db.query(
  `INSERT INTO slug_history (id, entity_type, entity_id, slug) VALUES (gen_random_uuid(), 'listing', $1, 'e2e-eski-lokanta')`,
  [e2eListing],
);
await fixtureListing('e2e-kapanan-lokanta', 'E2E Kapanan Lokanta', {
  status: 'CLOSED_PERMANENTLY',
});
await fixtureListing('e2e-kaldirilan-lokanta', 'E2E Kaldırılan Lokanta', { deleted: true });
await fixtureListing('ornek-lokanta-demo', 'Örnek Lokanta (Demo)', { origin: 'DEMO' });
// Hub E2E'leri için düşük yayın eşikleri (TEST-FIXTURE; üretim varsayılanları §7.2 — panelden değişir).
await db.query(
  `INSERT INTO platform_settings (key, value, version, updated_at) VALUES ('publication_thresholds', $1, 1, now())`,
  [
    JSON.stringify({
      provinceCategoryListings: 3,
      provinceCategoryArticles: 0,
      districtCategoryListings: 2,
      districtListings: 2,
      provinceGuides: 0,
      provinceHubs: 1,
    }),
  ],
);
await db.end();
// Doğrudan SQL ile eklenen fikstürler outbox'tan geçmez: arama okuma modelini baştan kur (REQ-ARA-002).
execFileSync('node', ['dist/cli/search-reindex.js'], {
  cwd: apiDir,
  // Yalnızca E2E: playwright.config.ts'deki sabit, gerçek olmayan test değerleri.
  env: {
    ...env,
    CURSOR_SECRET: 'e2e-cursor-secret-not-a-real-secret-0000',
    DATA_ENCRYPTION_KEY: 'e2'.repeat(32),
    STORAGE_ADAPTER: 'memory',
    EMAIL_ADAPTER: 'memory',
  },
  stdio: 'inherit',
});
console.log('E2E veritabanı hazır: incelemeler_e2e');
