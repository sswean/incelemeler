// OpenAPI belgesi ve üretilen istemci güncel mi? (REQ-MIM-006) — fark varsa CI kırmızı.
import { execFileSync } from 'node:child_process';

execFileSync('pnpm', ['openapi:generate'], { stdio: 'inherit' });
const diff = execFileSync(
  'git',
  ['status', '--porcelain', '--', 'docs/api/openapi.json', 'packages/api-client/src/schema.d.ts'],
  { encoding: 'utf8' },
);
if (diff.trim()) {
  console.error(
    'OpenAPI/istemci güncel değil. `pnpm openapi:generate` çalıştırıp commit edin:\n' + diff,
  );
  process.exit(1);
}
console.log('OpenAPI ve istemci güncel.');
