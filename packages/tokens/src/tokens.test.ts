import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast.js';
import { color, contrastPairs } from './tokens.js';

describe('[REQ-ERS-005] token kontrastları', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const [fg, bg, min] of contrastPairs) {
      it(`${theme}: ${fg} / ${bg} ≥ ${min}`, () => {
        expect(contrastRatio(color[theme][fg], color[theme][bg])).toBeGreaterThanOrEqual(min);
      });
    }
  }
  it('v1 vurgu rengi metin için yetersiz (yalnızca dekoratif kullanılır)', () => {
    expect(contrastRatio('#FF8A45', '#FFFFFF')).toBeLessThan(3);
  });
  it('v2 Ek A14.2 ölçümleriyle tutarlı', () => {
    expect(contrastRatio('#17191D', '#FFFFFF')).toBeCloseTo(17.6, 1);
    expect(contrastRatio('#315EFB', '#FFFFFF')).toBeCloseTo(5.09, 2);
    expect(contrastRatio('#868D98', '#FFFFFF')).toBeCloseTo(3.35, 2);
    expect(contrastRatio('#5B3A00', '#FFF3E0')).toBeCloseTo(9.34, 2);
  });
});
