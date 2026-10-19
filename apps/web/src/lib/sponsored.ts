import type { SearchHit, SponsoredItem } from '@incelemeler/contracts';

export type MergedEntry =
  | { kind: 'organic'; hit: SearchHit; rank: number }
  | { kind: 'sponsored'; sponsored: SponsoredItem };

/**
 * Organik ve sponsorlu öğeleri görsel listeye yerleştirir (REQ-SPN-002): sponsorlu öğe API'nin verdiği
 * 1 tabanlı pozisyona girer; organik sıra numarası (`rank`) sponsoru saymaz ve organik sıra değişmez.
 */
export function mergeSponsored(
  organic: readonly SearchHit[],
  sponsored: readonly SponsoredItem[],
): MergedEntry[] {
  const queue = [...sponsored].sort((a, b) => a.position - b.position);
  const out: MergedEntry[] = [];
  let rank = 0;
  for (const hit of organic) {
    while (queue[0] && queue[0].position === out.length + 1) {
      out.push({ kind: 'sponsored', sponsored: queue.shift()! });
    }
    out.push({ kind: 'organic', hit, rank: ++rank });
  }
  return out;
}
