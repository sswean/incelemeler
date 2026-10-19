// Gereksinim ↔ test izlenebilirliği (§12.10):
//  (a) aktif fazın her ZORUNLU REQ'i en az bir teste ya da MANUAL-QA kaydına bağlı (veya TAMAM dışı durumda gerekçeli),
//  (b) TAMAM durumundaki REQ'lerin testleri son yerel/CI koşusunda geçmiş (.ci-local/last-run.json),
//  (c) test adlarında geçen her REQ kimliği requirements.json'da var.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const req = JSON.parse(readFileSync('docs/requirements/requirements.json', 'utf8'));
const status = readFileSync('docs/STATUS.md', 'utf8');
const phaseMatch = /Aktif faz:\s*\*{0,2}(\d)/.exec(status);
if (!phaseMatch) {
  console.error('docs/STATUS.md içinde "Aktif faz: N" satırı bulunamadı.');
  process.exit(1);
}
const activePhase = Number(phaseMatch[1]);
const known = new Map(req.requirements.map((r) => [r.id, r]));

const TEST_FILE = /\.(test|int\.test|spec)\.(ts|tsx|mjs)$/;
const SKIP = new Set(['node_modules', 'dist', '.next', 'coverage', 'generated', '.turbo']);
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (TEST_FILE.test(name)) out.push(p);
  }
  return out;
}

const refs = new Map(); // REQ id -> Set(files)
for (const root of ['apps', 'packages', 'tests']) {
  if (!existsSync(root)) continue;
  for (const file of walk(root)) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/\[(REQ-[A-Z]{3}-\d{3})\]/g)) {
      if (!refs.has(m[1])) refs.set(m[1], new Set());
      refs.get(m[1]).add(file);
    }
  }
}
const manualQa = existsSync('docs/MANUAL-QA.md') ? readFileSync('docs/MANUAL-QA.md', 'utf8') : '';

const errors = [];
// (c)
for (const id of refs.keys())
  if (!known.has(id)) errors.push(`(c) Testte geçen ${id} requirements.json'da yok`);

// (a) Faz içinde: çalışılmaya başlanmış (BAŞLANMADI/ERTELENDİ dışı) ZORUNLU REQ'ler bağlı olmalı.
//     Faz kapısında (`--gate`): aktif fazın TÜM ZORUNLU REQ'leri bağlı olmalı.
const gate = process.argv.includes('--gate');
const active = req.requirements.filter((r) => r.phase === activePhase && r.level === 'ZORUNLU');
const toCheck = gate
  ? active
  : active.filter((r) => !['BAŞLANMADI', 'ERTELENDİ'].includes(r.status));
for (const r of toCheck) {
  const linked = refs.has(r.id) || manualQa.includes(r.id) || (r.tests ?? []).length > 0;
  const justified =
    ['ERTELENDİ', 'ENGELLİ', 'DOĞRULANAMADI', 'KISMİ'].includes(r.status) && r.notes;
  if (!linked && !justified)
    errors.push(
      `(a) Faz ${activePhase} ZORUNLU ${r.id} hiçbir teste/MANUAL-QA kaydına bağlı değil`,
    );
}

// (b)
const lastRunPath = '.ci-local/last-run.json';
const done = req.requirements.filter((r) => r.status === 'TAMAM');
if (done.length) {
  if (!existsSync(lastRunPath)) {
    console.warn(
      `(b) DOĞRULANAMADI: ${lastRunPath} yok — \`pnpm ci:local\` çalıştırın (X-031: CI yok).`,
    );
  } else {
    const last = JSON.parse(readFileSync(lastRunPath, 'utf8'));
    if (!last.passed)
      errors.push(
        `(b) Son ci:local koşusu başarısız (${last.finishedAt}); TAMAM durumları doğrulanamaz`,
      );
  }
}

const byStatus = req.requirements.reduce((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});
console.log(
  `${gate ? '[faz kapısı] ' : ''}Aktif faz ${activePhase}: ${active.length} ZORUNLU REQ · testlerde atıf yapılan REQ: ${refs.size} · durumlar: ${JSON.stringify(byStatus)}`,
);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('req:check: geçti.');
