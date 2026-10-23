import { ExperienceType, type VerdictBody } from '@incelemeler/contracts';

export type VerdictFormResult = { body: VerdictBody } | { error: string };

const lines = (v: string) =>
  v
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
/** "8,5" ya da "8.5" → 8.5; boş → null; sayı değilse NaN. */
function score(v: string): number | null {
  if (!v) return null;
  return Number(v.replace(',', '.'));
}

/**
 * Panel formunu API gövdesine çevirir (REQ-VER-005). Ölçüt satırı: "Lezzet | 8,5 | 2" (ad | puan | ağırlık;
 * ağırlık yazılmazsa 1). Kurallar (0,5 adım, derlemede puan yok) API'de doğrulanır.
 */
export function parseVerdictForm(get: (key: string) => string): VerdictFormResult {
  const experience = ExperienceType.safeParse(get('deneyim'));
  if (!experience.success) return { error: 'experience_required' };
  const s = score(get('puan'));
  if (s !== null && Number.isNaN(s)) return { error: 'invalid_score' };
  const criteria: VerdictBody['criteria'] = [];
  for (const line of lines(get('olcutler'))) {
    const [name = '', value = '', weight = '1'] = line.split('|').map((p) => p.trim());
    const cs = score(value);
    const w = Number(weight || '1');
    if (!name || cs === null || Number.isNaN(cs) || !Number.isInteger(w)) {
      return { error: 'invalid_criterion' };
    }
    criteria.push({ name, score: cs, weight: w });
  }
  return {
    body: {
      baseVersion: Number(get('baseVersion') || '0'),
      experienceType: experience.data,
      experienceNote: get('deneyimNotu') || null,
      testedAt: get('testTarihi') || null,
      score: s,
      criteria,
      pros: lines(get('artilar')),
      cons: lines(get('eksiler')),
      summary: get('ozet'),
      articleId: null,
    },
  };
}

/** Kayıtlı ölçütleri düzenlenebilir metne çevirir (parseVerdictForm'un tersi). */
export function criteriaToText(criteria: VerdictBody['criteria']): string {
  return criteria
    .map((c) => `${c.name} | ${String(c.score).replace('.', ',')} | ${c.weight}`)
    .join('\n');
}
