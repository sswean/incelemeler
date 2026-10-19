import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { assertSeedAllowed, SeedRefusedError } from './guard.js';
import { seedTaxonomy } from './seed-taxonomy.js';

/**
 * `pnpm seed:demo` — yerel/test/staging için başlangıç verisi.
 * Faz 0'da yalnızca platform taksonomisini yükler. Kurgusal (DEMO) listelemeler Faz 1'de eklenir
 * ve "(Demo)" ekiyle, dataOrigin=DEMO olarak işaretlenir (§12.4).
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
} finally {
  await prisma.$disconnect();
}
