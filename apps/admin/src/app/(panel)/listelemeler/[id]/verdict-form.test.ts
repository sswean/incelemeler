import { describe, expect, it } from 'vitest';
import { VerdictBody } from '@incelemeler/contracts';
import { criteriaToText, parseVerdictForm } from './verdict-form';

const form = (values: Record<string, string>) => (k: string) => values[k] ?? '';

describe('panel editör değerlendirmesi formu', () => {
  it('[REQ-VER-005] virgüllü puan, ölçüt satırları ve listeler gövdeye çevrilir', () => {
    const r = parseVerdictForm(
      form({
        baseVersion: '2',
        deneyim: 'VISITED',
        deneyimNotu: 'Akşam yemeği',
        testTarihi: '2026-09-12',
        puan: '8,5',
        olcutler: 'Lezzet | 9 | 2\n\nHizmet | 7,5',
        artilar: 'Taze balık\nManzara',
        eksiler: 'Kalabalık',
        ozet: 'Taze ürün ve dikkatli servis; tutarlı bir deniz restoranı.',
      }),
    );
    expect('body' in r && VerdictBody.parse(r.body)).toEqual({
      baseVersion: 2,
      experienceType: 'VISITED',
      experienceNote: 'Akşam yemeği',
      testedAt: '2026-09-12',
      score: 8.5,
      criteria: [
        { name: 'Lezzet', score: 9, weight: 2 },
        { name: 'Hizmet', score: 7.5, weight: 1 },
      ],
      pros: ['Taze balık', 'Manzara'],
      cons: ['Kalabalık'],
      summary: 'Taze ürün ve dikkatli servis; tutarlı bir deniz restoranı.',
      articleId: null,
    });
  });

  it('[REQ-VER-005] [REQ-ICR-007] derlemede puan boş kalır; hatalı girişler kodla döner', () => {
    const r = parseVerdictForm(
      form({
        deneyim: 'RESEARCH_ONLY',
        ozet: 'Kaynaklardan derlenen bilgilerle hazırlanmış özet.',
      }),
    );
    expect('body' in r && r.body).toMatchObject({ score: null, criteria: [], baseVersion: 0 });
    expect(parseVerdictForm(form({}))).toEqual({ error: 'experience_required' });
    expect(parseVerdictForm(form({ deneyim: 'VISITED', puan: 'iyi' }))).toEqual({
      error: 'invalid_score',
    });
    expect(parseVerdictForm(form({ deneyim: 'VISITED', olcutler: 'Lezzet' }))).toEqual({
      error: 'invalid_criterion',
    });
    expect(criteriaToText([{ name: 'Hizmet', score: 7.5, weight: 1 }])).toBe('Hizmet | 7,5 | 1');
  });
});
