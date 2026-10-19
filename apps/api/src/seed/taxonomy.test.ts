import { describe, expect, it } from 'vitest';
import { flattenTaxonomy } from './taxonomy.js';

describe('[REQ-KAT-002] başlangıç taksonomisi', () => {
  const flat = flattenTaxonomy();

  it("slug'lar benzersiz", () => {
    expect(new Set(flat.map((c) => c.slug)).size).toBe(flat.length);
  });

  it('özellikler kategori olarak yer almaz (beş eksen, Ç-12)', () => {
    const names = flat.map((c) => c.name.toLocaleLowerCase('tr-TR'));
    for (const forbidden of ['aile dostu', 'bütçe dostu', 'balayı otelleri', 'şehir rehberleri']) {
      expect(names).not.toContain(forbidden);
    }
  });

  it('[REQ-KAT-004] lisans gerektiren kategoriler işaretli', () => {
    const bySlug = new Map(flat.map((c) => [c.slug, c]));
    expect(bySlug.get('turist-rehberleri')?.requiresLicense).toBe(true);
    expect(bySlug.get('oteller')?.requiresLicense).toBe(true);
  });

  it('[REQ-KAT-004] YMYL ve lisanslı kategoriler sponsorluğa kapalı; YMYL uzman incelemesi ister', () => {
    for (const c of flat) {
      if (c.ymyl || c.requiresLicense) expect(c.sponsorshipAllowed, c.slug).toBe(false);
      if (c.ymyl) expect(c.requiresExpertReview, c.slug).toBe(true);
    }
    expect(flat.find((c) => c.slug === 'konaklama')?.sponsorshipAllowed).toBe(false);
  });

  it('her çocuğun izinli türleri ebeveynin türleri içinde', () => {
    const bySlug = new Map(flat.map((c) => [c.slug, c]));
    for (const c of flat) {
      if (!c.parentSlug) continue;
      const parent = bySlug.get(c.parentSlug);
      expect(parent).toBeDefined();
      for (const k of c.allowedKinds) expect(parent?.allowedKinds).toContain(k);
    }
  });
});
