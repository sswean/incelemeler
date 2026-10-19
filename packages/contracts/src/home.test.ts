import { describe, expect, it } from 'vitest';
import { homeRuleErrors } from './home.js';

const m = (type: string, position: number, maxItems = 8, enabled = true) =>
  ({ type, position, maxItems, enabled }) as Parameters<typeof homeRuleErrors>[0][number];
const base = [m('CATEGORY_SHORTCUTS', 10), m('CITY_PICKER', 20), m('EDITORS_PICKS', 30)];

describe('[REQ-ADM-006] [REQ-SPN-004] ana sayfa sponsorlu sınırları (A8.3)', () => {
  it('varsayılan düzen geçerli', () => {
    expect(homeRuleErrors([...base, m('SPONSORED', 80, 2)])).toEqual([]);
  });
  it('ilk ekranda / ilk 3 modülde sponsorlu yok', () => {
    expect(homeRuleErrors([...base, m('SPONSORED', 5, 2)])).toContain('home_sponsored_position');
  });
  it('en çok 2 sponsorlu modül, modül başına en çok 2 kart', () => {
    expect(
      homeRuleErrors([
        ...base,
        m('SPONSORED', 40, 2),
        m('SPONSORED', 50, 2),
        m('SPONSORED', 60, 2),
      ]),
    ).toContain('home_sponsored_modules');
    expect(homeRuleErrors([...base, m('SPONSORED', 40, 3)])).toContain('home_sponsored_cards');
  });
  it('kapalı modül sayılmaz', () => {
    expect(homeRuleErrors([...base, m('SPONSORED', 1, 2, false)])).toEqual([]);
  });
});
