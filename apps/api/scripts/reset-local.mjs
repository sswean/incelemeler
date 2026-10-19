// `pnpm db:reset:local` — yalnızca yerel veritabanını sıfırlar (§9.5, C sınıfı koruması).
import { execFileSync } from 'node:child_process';

const url = process.env.DATABASE_URL ?? '';
let host = '';
try {
  host = new URL(url).hostname;
} catch {
  console.error('DATABASE_URL geçersiz');
  process.exit(1);
}
if (!['localhost', '127.0.0.1', '::1'].includes(host) || process.env.APP_ENV === 'production') {
  console.error(`REDDEDİLDİ: db:reset:local yalnızca yerel veritabanında çalışır (host=${host}).`);
  process.exit(2);
}
execFileSync('npx', ['prisma', 'migrate', 'reset', '--force'], { stdio: 'inherit' });
