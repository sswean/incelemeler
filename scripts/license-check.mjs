// Lisans denetimi (§13.2, REQ-GUV-013): izin listesi dışı lisans yeni eklenirse CI kırmızı olur.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const cfg = JSON.parse(readFileSync('license-exceptions.json', 'utf8'));
const allowed = new Set(cfg.allowedLicenses);
const pending = cfg.pendingApproval;
const data = JSON.parse(
  execFileSync('pnpm', ['licenses', 'list', '--json'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }),
);

const violations = [];
const exceptions = [];
for (const [license, pkgs] of Object.entries(data)) {
  const parts = license.replace(/[()]/g, '').split(/\s+(?:OR|AND|and|or)\s+/);
  const ok =
    parts.every((p) => allowed.has(p)) ||
    (license.includes(' OR ') && parts.some((p) => allowed.has(p)));
  if (ok) continue;
  for (const p of pkgs) {
    if (pending[p.name]) exceptions.push(`${p.name} (${license})`);
    else violations.push(`${p.name}@${(p.versions ?? []).join(',')} (${license})`);
  }
}
if (exceptions.length)
  console.log(`Onay bekleyen istisnalar (${exceptions.length}) — Q-003: ${exceptions.join(', ')}`);
if (violations.length) {
  console.error(`İzin listesi dışı lisans (C sınıfı):\n  ${violations.join('\n  ')}`);
  process.exit(1);
}
console.log('Lisans denetimi: yeni ihlal yok.');
