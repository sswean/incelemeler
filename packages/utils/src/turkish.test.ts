import { describe, expect, it } from 'vitest';
import { compareTr, foldTr, lowerTr, normalizeTr, slugifyTr, upperTr } from './turkish.js';

describe('[REQ-YRL-001] Türkçe büyük/küçük harf', () => {
  it('I → ı ve İ → i dönüşür', () => {
    expect(lowerTr('IĞDIR')).toBe('ığdır');
    expect(lowerTr('İSTANBUL')).toBe('istanbul');
    expect(lowerTr('İstanbul')).toHaveLength(8);
  });
  it('i → İ ve ı → I dönüşür', () => {
    expect(upperTr('istanbul')).toBe('İSTANBUL');
    expect(upperTr('ılık')).toBe('ILIK');
  });
  it('foldTr aksanları katlar', () => {
    expect(foldTr('çğıöşü')).toBe('cgiosu');
  });
});

describe('[REQ-YRL-001] slugifyTr', () => {
  const cases: Array<[string, string]> = [
    ["İzmir'in Çeşme'si", 'izmirin-cesmesi'],
    ['IĞDIR', 'igdir'],
    ['İstanbul', 'istanbul'],
    ['  Kahvaltı   Mekanları!! ', 'kahvalti-mekanlari'],
    ['Şişli / Üsküdar', 'sisli-uskudar'],
    ['Apple iPhone 16 Pro', 'apple-iphone-16-pro'],
    ['Örnek Kahvaltı Evi (Demo)', 'ornek-kahvalti-evi-demo'],
    ['--a--b--', 'a-b'],
  ];
  it.each(cases)('%s → %s', (input, expected) => {
    expect(slugifyTr(input)).toBe(expected);
  });
});

describe('[REQ-ARA-003] normalizeTr', () => {
  it('büyük/küçük harf ve noktalı İ varyantları aynı sonucu verir', () => {
    const a = normalizeTr('İSTANBUL');
    const b = normalizeTr('Istanbul');
    const c = normalizeTr('istanbul');
    expect(a.folded).toBe('istanbul');
    expect(c.folded).toBe('istanbul');
    // "Istanbul" Türkçe kuralla "ıstanbul" olur; katlanmış varyant eşleşir.
    expect(b.folded).toBe('istanbul');
  });
  it('kesme işaretinden sonraki eki atar (tüm varyantlar)', () => {
    expect(normalizeTr("Antalya'da otel").tr).toBe('antalya otel');
    expect(normalizeTr('Kapadokya’ya tur').tr).toBe('kapadokya tur');
    expect(normalizeTr('İzmir`de kahvaltı').tr).toBe('izmir kahvaltı');
  });
  it('Türkçe karaktersiz yazımla eşleşen katlanmış varyant üretir', () => {
    expect(normalizeTr('Kahvaltı Şişli Üsküdar').folded).toBe('kahvalti sisli uskudar');
    expect(normalizeTr('kahvalti sisli uskudar').folded).toBe('kahvalti sisli uskudar');
  });
  it('noktalama ve fazla boşlukları temizler', () => {
    expect(normalizeTr('  denize   yakın, uygun-fiyatlı! ').tr).toBe('denize yakın uygun fiyatlı');
  });
});

describe('[REQ-YRL-003] Türkçe sıralama', () => {
  it('ç, c sonrasında; ı, h ile i arasında sıralanır', () => {
    const words = ['çay', 'can', 'ışık', 'ilk', 'hız'];
    expect([...words].sort(compareTr)).toEqual(['can', 'çay', 'hız', 'ışık', 'ilk']);
  });
});
