import { describe, expect, it } from 'vitest';
import { tr } from './tr.js';

function leaves(obj: unknown, path = ''): Array<[string, unknown]> {
  if (typeof obj !== 'object' || obj === null) return [[path, obj]];
  return Object.entries(obj).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
}

describe('tr-TR metin kataloğu (§4.3)', () => {
  it('her anahtar boş olmayan bir metindir', () => {
    for (const [key, value] of leaves(tr)) {
      expect(typeof value, key).toBe('string');
      expect((value as string).trim().length, key).toBeGreaterThan(0);
    }
  });
  it('[REQ-YRL-005] marka sloganı v2 ile aynı', () => {
    expect(tr.brand.slogan).toBe('Keşfet. Karşılaştır. Karar ver.');
  });
  it('[REQ-YRL-005] hitap "sen": "siz" çekimli sözcük yok (docs/ux/metin-rehberi.md)', () => {
    const siz = /(?<!\p{L})\p{L}+(iniz|ınız|unuz|ünüz)(?!\p{L})/u;
    const offenders = leaves(tr).filter(([, v]) => siz.test(String(v)));
    expect(offenders).toEqual([]);
  });
  it('[REQ-YRL-006] sahte aciliyet, kıtlık ve utandırıcı ret metni yok', () => {
    const dark =
      /acele et|tükeniyor|kaçırma|sadece bugün|son \d+ (oda|ürün|yer|kişi)|şu an \d+ kişi|hayır,? .*istemiyorum|stoklar sınırlı/iu;
    const offenders = leaves(tr).filter(([, v]) => dark.test(String(v)));
    expect(offenders).toEqual([]);
  });
});
