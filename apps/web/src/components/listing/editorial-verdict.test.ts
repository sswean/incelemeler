import { describe, expect, it } from 'vitest';
import { experienceStatement } from './editorial-verdict';

describe('editör değerlendirmesi deneyim beyanı', () => {
  it('[REQ-ICR-007] beyan her zaman metinle; ayrıntı ve ziyaret ayı parantez içinde', () => {
    expect(
      experienceStatement({
        experienceType: 'TESTED_IN_PERSON',
        experienceNote: '2 hafta, günlük kullanım',
        testedAt: null,
      }),
    ).toBe('Bizzat test edildi (2 hafta, günlük kullanım)');
    expect(
      experienceStatement({
        experienceType: 'VISITED',
        experienceNote: null,
        testedAt: '2026-09-12',
      }),
    ).toBe('Yerinde ziyaret edildi (Eylül 2026)');
    expect(
      experienceStatement({
        experienceType: 'RESEARCH_ONLY',
        experienceNote: null,
        testedAt: null,
      }),
    ).toBe('Kaynaklardan derlendi — denenmedi');
  });
});
