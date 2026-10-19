// Ek A'daki REQ satırlarını docs/requirements/<ALAN>.md ve requirements.json'a aktarır (§8.1/3).
// Var olan requirements.json'daki durum alanları (status, tests, lastVerifiedCommit, notes) korunur.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const prompt = readFileSync('docs/prompt/PROMPT-v2.md', 'utf8');
const outDir = 'docs/requirements';
const jsonPath = `${outDir}/requirements.json`;

const AREAS = {
  GEN: 'Genel',
  MIM: 'Mimari ve API',
  VER: 'Veri modeli',
  HSP: 'Hesap, kimlik ve yetki',
  KAT: 'Kategori ve taksonomi',
  LST: 'Listeleme',
  ICR: 'İçerik ve editör',
  DEG: 'Değerlendirme ve puan',
  GUN: 'Güven ve moderasyon',
  ARA: 'Arama ve filtre',
  SPN: 'Sponsorluk',
  AFF: 'Dış yönlendirme ve affiliate',
  ENT: 'Dış entegrasyon',
  ADM: 'Yönetim paneli',
  ISL: 'İşletme ve reklamveren portalı',
  MOB: 'Mobil',
  SEO: 'SEO',
  TSR: 'Tasarım sistemi ve marka',
  YRL: 'Yerelleştirme ve UX durumları',
  GUV: 'Güvenlik',
  KVK: 'Kişisel veri ve hukuk',
  ERS: 'Erişilebilirlik',
  PRF: 'Performans',
  ANL: 'Analitik',
  OPS: 'Altyapı ve operasyon',
  TST: 'Test',
};
const LEVELS = ['ZORUNLU', 'YASAK', 'OLMALI', 'OLMAMALI', 'ÖNERİLİR', 'İSTEĞE BAĞLI'];

const rowRe = /^\| (REQ-([A-Z]{3})-(\d{3})) \| ([^|]+?) · (\d) \| (.+) \|\s*$/;
const reqs = [];
for (const line of prompt.split('\n')) {
  const m = rowRe.exec(line);
  if (!m) continue;
  const [, id, area, , level, phase, text] = m;
  if (!LEVELS.includes(level.trim())) throw new Error(`${id}: bilinmeyen düzey "${level}"`);
  const kabul = /\*\*Kabul[^*]*\*\*\s*(.+)$/.exec(text);
  reqs.push({
    id,
    area,
    level: level.trim(),
    phase: Number(phase),
    text: text.trim(),
    acceptance: kabul ? kabul[1].trim() : null,
  });
}
const ids = reqs.map((r) => r.id);
const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
if (dup.length) throw new Error(`Yinelenen REQ: ${dup.join(', ')}`);

const previous = existsSync(jsonPath)
  ? JSON.parse(readFileSync(jsonPath, 'utf8'))
  : { requirements: [] };
const prevById = new Map(previous.requirements.map((r) => [r.id, r]));

const title = (text) => {
  const plain = text.replace(/\*\*/g, '').replace(/`/g, '');
  const first = plain.split(/[.:;](\s|$)/)[0];
  return first.length > 90 ? `${first.slice(0, 87)}…` : first;
};

const records = reqs.map((r) => {
  const prev = prevById.get(r.id);
  return {
    id: r.id,
    title: title(r.text),
    level: r.level,
    phase: r.phase,
    status: prev?.status ?? 'BAŞLANMADI',
    verification: prev?.verification ?? (r.area === 'MOB' ? 'T|M' : 'T'),
    acceptance: r.acceptance,
    tests: prev?.tests ?? [],
    lastVerifiedCommit: prev?.lastVerifiedCommit ?? null,
    notes: prev?.notes ?? '',
  };
});
writeFileSync(
  jsonPath,
  JSON.stringify({ source: 'docs/prompt/PROMPT-v2.md (Ek A)', requirements: records }, null, 2) +
    '\n',
);

for (const [code, name] of Object.entries(AREAS)) {
  const list = reqs.filter((r) => r.area === code);
  if (!list.length) continue;
  const body = list
    .map(
      (r) =>
        `### ${r.id}\n- Düzey: ${r.level} · Faz: ${r.phase} · Kaynak: v2 Ek A\n- Gereksinim: ${r.text}\n- Kabul kriterleri: ${r.acceptance ?? '_Dilim başlangıcında, test-önce adımında yazılır (§9.3/2)._'}\n`,
    )
    .join('\n');
  writeFileSync(
    `${outDir}/${code}.md`,
    `# ${code} — ${name}\n\n> Ek A'dan otomatik aktarıldı (\`node scripts/import-requirements.mjs\`). Durumlar \`requirements.json\` içindedir.\n\n${body}`,
  );
}
const byPhase = records.reduce((a, r) => ((a[r.phase] = (a[r.phase] ?? 0) + 1), a), {});
console.log(`${records.length} REQ aktarıldı; faz dağılımı: ${JSON.stringify(byPhase)}`);
