import { describe, expect, it } from 'vitest';
import { nextSanctionLevel, SanctionCreateBody } from './sanctions.js';

describe('yaptırım basamakları', () => {
  it('[REQ-GUN-007] sıra uyarı → kısıtlama → askı → kalıcı; süre yalnızca süreli basamaklarda', () => {
    expect(nextSanctionLevel([])).toBe('WARNING');
    expect(nextSanctionLevel(['WARNING'])).toBe('REVIEW_RESTRICTION');
    expect(nextSanctionLevel(['WARNING', 'REVIEW_RESTRICTION'])).toBe('SUSPENSION');
    expect(nextSanctionLevel(['SUSPENSION', 'WARNING'])).toBe('PERMANENT_BAN');
    expect(nextSanctionLevel(['PERMANENT_BAN'])).toBe('PERMANENT_BAN');
    const base = { email: 'a@example.com', reasonCode: 'SPAM', note: 'Tekrarlayan reklam.' };
    expect(SanctionCreateBody.safeParse({ ...base, level: 'WARNING' }).success).toBe(true);
    expect(
      SanctionCreateBody.safeParse({ ...base, level: 'WARNING', durationDays: 3 }).success,
    ).toBe(false);
    expect(SanctionCreateBody.safeParse({ ...base, level: 'SUSPENSION' }).success).toBe(false);
    expect(
      SanctionCreateBody.safeParse({ ...base, level: 'SUSPENSION', durationDays: 7 }).success,
    ).toBe(true);
    expect(
      SanctionCreateBody.safeParse({ ...base, level: 'REVIEW_RESTRICTION', durationDays: 91 })
        .success,
    ).toBe(false);
  });
});
