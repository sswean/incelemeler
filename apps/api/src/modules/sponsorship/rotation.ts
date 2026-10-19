import { createHash } from 'node:crypto';

export interface Candidate {
  placementId: string;
  campaignId: string;
  listingId: string;
  priority: number;
  weight: number;
}

/** [0, 1) aralığında deterministik sayı: aynı tohum + anahtar her zaman aynı değeri verir. */
function unit(seed: string, key: string): number {
  const h = createHash('sha256').update(`${seed}:${key}`).digest();
  return h.readUInt32BE(0) / 2 ** 32;
}

/**
 * Yuva rekabeti (REQ-SPN-008): önce öncelik, aynı öncelikte ağırlıklı rastgele sıra (Efraimidis–Spirakis
 * anahtarı u^(1/w)); istek başına tohumlu ve deterministik. Aynı kampanya ya da aynı listeleme bir kez seçilir.
 */
export function pickPlacements(
  candidates: readonly Candidate[],
  count: number,
  seed: string,
): Candidate[] {
  const keyed = candidates
    .filter((c) => c.weight > 0)
    .map((c) => ({ c, k: Math.pow(unit(seed, c.placementId), 1 / c.weight) }))
    .sort((a, b) => b.c.priority - a.c.priority || b.k - a.k);
  const out: Candidate[] = [];
  const campaigns = new Set<string>();
  const listings = new Set<string>();
  for (const { c } of keyed) {
    if (out.length >= count) break;
    if (campaigns.has(c.campaignId) || listings.has(c.listingId)) continue;
    campaigns.add(c.campaignId);
    listings.add(c.listingId);
    out.push(c);
  }
  return out;
}

/**
 * Seçilen öğelere görsel sıra atar (1 tabanlı birleşik liste). Organik listenin sonundan ötedeki pozisyon
 * kullanılmaz (sayfa sponsorlu öğeyle bitmez/şişmez).
 */
export function assignPositions<T>(
  picked: readonly T[],
  positions: readonly number[],
  organicCount: number,
): Array<{ position: number; item: T }> {
  const sorted = [...positions].sort((a, b) => a - b);
  const out: Array<{ position: number; item: T }> = [];
  for (let i = 0; i < picked.length && i < sorted.length; i++) {
    const position = sorted[i]!;
    // Sponsorlu öğeden önce gelen organik öğe sayısı (position - 1 - önceki sponsorlu) mevcut olmalı ve
    // ardından en az bir organik öğe kalmalı: sayfa sponsorlu öğeyle bitmez.
    if (position - 1 - i >= organicCount) break;
    out.push({ position, item: picked[i]! });
  }
  return out;
}
