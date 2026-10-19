import { describe, expect, it } from 'vitest';
import { SURFACE_CAPS, slotRuleErrors } from './sponsorship.js';

describe('[REQ-SPN-004] yerleşim sınırları (A8.3) — panelden aşılamaz', () => {
  it('varsayılan yuvalar kurallara uyar', () => {
    for (const [surface, cap] of Object.entries(SURFACE_CAPS)) {
      expect(
        slotRuleErrors(surface as keyof typeof SURFACE_CAPS, cap.maxItems, cap.positions),
      ).toEqual([]);
    }
  });

  it.each([
    ['SEARCH', 3, [3, 13, 23], 'max_items_cap'],
    ['SEARCH', 2, [3, 8], 'first_ten_cap'],
    ['CATEGORY_LIST', 2, [3, 4], 'positions_adjacent'],
    ['CATEGORY_LIST', 2, [3, 3], 'positions_duplicate'],
    ['CATEGORY_LIST', 2, [3], 'positions_count'],
    ['LISTING_DETAIL', 2, [1, 3], 'max_items_cap'],
    ['HOME', 1, [1], 'positions_range'],
  ] as const)('%s maxItems=%i %j → %s', (surface, max, positions, code) => {
    expect(slotRuleErrors(surface, max, positions)).toContain(code);
  });

  it('sınır düşürülebilir (0 = yuva kapalı)', () => {
    expect(slotRuleErrors('SEARCH', 1, [5])).toEqual([]);
    expect(slotRuleErrors('CATEGORY_LIST', 0, [])).toEqual([]);
  });
});
