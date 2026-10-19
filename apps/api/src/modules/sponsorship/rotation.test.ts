import { describe, expect, it } from 'vitest';
import { assignPositions, type Candidate, pickPlacements } from './rotation.js';

const c = (id: string, weight = 1, priority = 0, campaign = id, listing = id): Candidate => ({
  placementId: id,
  campaignId: campaign,
  listingId: listing,
  priority,
  weight,
});

describe('[REQ-SPN-008] yuva rekabeti: ağırlıklı, tohumlu, deterministik rotasyon', () => {
  it('aynı tohum aynı seçimi verir; farklı tohumlar dönüşümlü seçer', () => {
    const all = [c('a'), c('b'), c('c')];
    expect(pickPlacements(all, 1, 's1')).toEqual(pickPlacements(all, 1, 's1'));
    const seen = new Set(
      Array.from({ length: 60 }, (_, i) => pickPlacements(all, 1, `t${i}`)[0]!.placementId),
    );
    expect(seen.size).toBe(3);
  });

  it('ağırlık payı yaklaşık korunur (adil pay)', () => {
    const all = [c('a', 3), c('b', 1)];
    let a = 0;
    for (let i = 0; i < 2000; i++) if (pickPlacements(all, 1, `r${i}`)[0]!.placementId === 'a') a++;
    expect(a / 2000).toBeGreaterThan(0.68);
    expect(a / 2000).toBeLessThan(0.82);
  });

  it('öncelik ağırlıktan önce gelir; aynı kampanya ya da listeleme iki kez seçilmez', () => {
    expect(pickPlacements([c('a', 100), c('b', 1, 5)], 1, 'x')[0]!.placementId).toBe('b');
    const picked = pickPlacements(
      [c('a', 1, 0, 'k'), c('b', 1, 0, 'k'), c('d', 1, 0, 'm', 'a')],
      3,
      'x',
    );
    expect(picked).toHaveLength(1);
  });
});

describe('[REQ-SPN-002] [REQ-SPN-004] pozisyon ataması', () => {
  it('organik liste kısaysa sayfa sponsorlu öğeyle şişmez', () => {
    expect(assignPositions(['x', 'y'], [3, 8], 20)).toEqual([
      { position: 3, item: 'x' },
      { position: 8, item: 'y' },
    ]);
    expect(assignPositions(['x', 'y'], [3, 8], 4)).toEqual([{ position: 3, item: 'x' }]);
    expect(assignPositions(['x'], [3], 1)).toEqual([]);
  });
});
