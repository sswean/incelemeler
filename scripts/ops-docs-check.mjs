// `pnpm ops:check` — işletim belgeleri mevcut ve dolu (REQ-OPS-008, REQ-OPS-010, REQ-OPS-003).
import { existsSync, readFileSync } from 'node:fs';

const REQUIRED = [
  'docs/ops/dagitim.md',
  'docs/ops/geri-alma.md',
  'docs/ops/veritabani-geri-yukleme.md',
  'docs/ops/sir-rotasyonu.md',
  'docs/ops/olay-mudahale.md',
  'docs/ops/veri-ihlali.md',
  'docs/ops/kampanya-acil-durdurma.md',
  'docs/ops/moderasyon-yigilmasi.md',
  'docs/ops/canliya-gecis.md',
  'docs/DECISIONS/ADR-0014-barindirma-onerisi.md',
];
const missing = REQUIRED.filter(
  (f) => !existsSync(f) || readFileSync(f, 'utf8').trim().split('\n').length < 8,
);
if (missing.length) {
  console.error(`Eksik ya da boş işletim belgesi:\n${missing.join('\n')}`);
  process.exit(1);
}
console.log(`ops:check: ${REQUIRED.length} belge hazır.`);
