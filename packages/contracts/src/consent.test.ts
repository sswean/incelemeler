import { describe, expect, it } from 'vitest';
import { decodeConsent, encodeConsent } from './consent.js';

const id = '0b6f3c1e-5d2a-4f7b-9c8e-1a2b3c4d5e6f';

describe('[REQ-KVK-003] tercih çerezi', () => {
  it('kodlar ve çözer; kişisel veri içermez', () => {
    const s = {
      anonymousId: id,
      functional: false,
      analytics: true,
      marketing: false,
      at: 1_790_000_000,
    };
    const v = encodeConsent(s);
    expect(v).toBe(`1.${id}.010.1790000000`);
    expect(decodeConsent(v)).toEqual(s);
  });

  it.each([null, '', 'x', `2.${id}.000.1`, `1.kimlik.000.1`, `1.${id}.0a0.1`, `1.${id}.000.-5`])(
    'geçersiz değer %s → null (bant yeniden gösterilir)',
    (v) => {
      expect(decodeConsent(v)).toBeNull();
    },
  );
});
