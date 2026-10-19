import { describe, expect, it } from 'vitest';
import type { SearchHit, SponsoredItem } from '@incelemeler/contracts';
import { mergeSponsored } from './sponsored';

const hit = (id: string): SearchHit => ({
  type: 'LISTING',
  id,
  title: id,
  subtitle: null,
  path: `/mekan/${id}`,
  kind: 'PLACE',
  articleType: null,
  status: 'PUBLISHED',
  priceLevel: null,
  ratingCount: 0,
  distanceKm: null,
  dataOrigin: 'EDITORIAL',
  commercial: { type: 'NONE' },
});
const sp = (id: string, position: number): SponsoredItem => ({
  position,
  placementId: `p-${id}`,
  item: {
    ...hit(id),
    commercial: { type: 'SPONSORED', sponsor: 'S', label: 'Sponsorlu', why: '' },
  },
  clickHref: `/git/s/p-${id}`,
  impressionToken: 't',
});

describe('[REQ-SPN-002] organik + sponsorlu yerleşim', () => {
  it('sponsorlu öğe pozisyonuna girer; organik sıra ve numara değişmez', () => {
    const organic = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(hit);
    const merged = mergeSponsored(organic, [sp('x', 8), sp('y', 3)]);
    expect(
      merged.map((m) => (m.kind === 'organic' ? m.hit.id : `[${m.sponsored.item.id}]`)),
    ).toEqual(['a', 'b', '[y]', 'c', 'd', 'e', 'f', '[x]', 'g', 'h']);
    expect(
      merged.filter((m) => m.kind === 'organic').map((m) => m.kind === 'organic' && m.rank),
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('organik liste bitince sponsorlu öğe sona eklenmez', () => {
    const merged = mergeSponsored(['a', 'b'].map(hit), [sp('x', 3)]);
    expect(merged.every((m) => m.kind === 'organic')).toBe(true);
  });
});
