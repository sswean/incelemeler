// `pnpm migration:check` — migration güvenliği (REQ-VER-022, REQ-OPS-004): ileri yönlü, geriye uyumlu şema.
// Yıkıcı DDL (tablo/sütun silme, yeniden adlandırma, tür değiştirme, enum silme) yalnızca ADR'li açık işaretle
// (`-- migration-safety: ADR-XXXX gerekçe`) ya da uygulanmış eski migration'lar için izin listesiyle geçer.
// Genişlet/daralt (expand/contract): önce ekle + çift yaz, sonraki sürümde eskiyi kaldır (docs/ops/geri-alma.md).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'apps/api/prisma/migrations';
const allow = JSON.parse(readFileSync('apps/api/prisma/migration-safety-allowlist.json', 'utf8'));
const DESTRUCTIVE = [
  [/\bDROP\s+TABLE\b/i, 'tablo silme'],
  [/\bDROP\s+COLUMN\b/i, 'sütun silme'],
  [/\bRENAME\s+(COLUMN\b|TO\b)/i, 'yeniden adlandırma'],
  [/\bALTER\s+COLUMN\s+\S+\s+(SET\s+DATA\s+)?TYPE\b/i, 'tür değiştirme'],
  [/\bDROP\s+TYPE\b/i, 'enum/tür silme'],
  [/\bRENAME\s+VALUE\b/i, 'enum değeri yeniden adlandırma'],
];
const errors = [];
let checked = 0;
for (const name of readdirSync(dir).sort()) {
  const file = join(dir, name, 'migration.sql');
  if (!existsSync(file)) continue;
  checked++;
  // Yorum satırları sayılmaz (açıklamalar yıkıcı sözcük içerebilir).
  const sql = readFileSync(file, 'utf8');
  const code = sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n');
  const marked = /^--\s*migration-safety:\s*ADR-\d{4}\s+\S+/m.test(sql);
  for (const [re, what] of DESTRUCTIVE) {
    if (re.test(code) && !marked && !allow[name]) {
      errors.push(
        `${name}: ${what} — ADR'li \`-- migration-safety:\` işareti yok (genişlet/daralt kullan)`,
      );
    }
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `migration:check: ${checked} migration denetlendi, yıkıcı DDL yok (izin listesi: ${Object.keys(allow).filter((k) => !k.startsWith('_')).length}).`,
);
