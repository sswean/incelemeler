import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { assertSeedAllowed, SeedRefusedError } from './guard.js';
import { seedDemoListings } from './demo-listings.js';
import { seedSearchDefaults } from './seed-search.js';
import { seedTaxonomy } from './seed-taxonomy.js';

/**
 * `pnpm seed:demo` — yerel/test/staging için başlangıç verisi.
 * Platform taksonomisi, arama sözlüğü ve kurgusal (DEMO) listelemeler — "(Demo)" ekiyle,
 * dataOrigin=DEMO olarak işaretlenir (§12.4); üretimde reddeder.
 */
try {
  assertSeedAllowed(process.env.APP_ENV);
} catch (e) {
  if (e instanceof SeedRefusedError) {
    console.error(`[seed] REDDEDİLDİ: ${e.message}`);
    process.exit(2);
  }
  throw e;
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('[seed] DATABASE_URL tanımsız');
  process.exit(1);
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
try {
  const n = await seedTaxonomy(prisma);
  console.warn(`[seed] ${n} kategori yüklendi (taksonomi, idempotent).`);
  await seedSearchDefaults(prisma);
  console.warn('[seed] arama sözlüğü ve filtrelenebilir özellikler yüklendi (idempotent).');
  const demo = await seedDemoListings(prisma);
  console.warn(
    `[seed] ${demo.length} kurgusal demo listeleme eklendi ("(Demo)", dataOrigin=DEMO). Aramaya yansıması için: pnpm search:reindex`,
  );
} finally {
  await prisma.$disconnect();
}
