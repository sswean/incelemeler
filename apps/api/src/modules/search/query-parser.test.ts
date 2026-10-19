import { describe, expect, it } from 'vitest';
import { editDistance, type Lexicon, mergeIntentFilters, parseQuery } from './query-parser.js';

const lex: Lexicon = {
  places: [
    {
      id: 'p-ist',
      level: 'PROVINCE',
      provinceId: 'p-ist',
      name: 'İstanbul',
      terms: ['istanbul'],
      fuzzy: true,
    },
    {
      id: 'p-izm',
      level: 'PROVINCE',
      provinceId: 'p-izm',
      name: 'İzmir',
      terms: ['izmir'],
      fuzzy: true,
    },
    {
      id: 'p-ant',
      level: 'PROVINCE',
      provinceId: 'p-ant',
      name: 'Antalya',
      terms: ['antalya'],
      fuzzy: true,
    },
    {
      id: 'p-nev',
      level: 'PROVINCE',
      provinceId: 'p-nev',
      name: 'Nevşehir',
      terms: ['nevsehir', 'kapadokya'],
      fuzzy: true,
    },
    {
      id: 'd-kad',
      level: 'DISTRICT',
      provinceId: 'p-ist',
      name: 'Kadıköy',
      terms: ['kadikoy'],
      fuzzy: false,
    },
  ],
  categories: [
    {
      id: 'c-kah',
      slug: 'kahvalti-mekanlari',
      name: 'Kahvaltı Mekanları',
      terms: ['kahvalti mekanlari'],
    },
    { id: 'c-otl', slug: 'oteller', name: 'Oteller', terms: ['oteller', 'otel'] },
    { id: 'c-res', slug: 'restoranlar', name: 'Restoranlar', terms: ['restoranlar', 'restoran'] },
    { id: 'c-ark', slug: 'arac-kiralama', name: 'Araç Kiralama', terms: ['arac kiralama'] },
    { id: 'c-kul', slug: 'kulakliklar', name: 'Kulaklıklar', terms: ['kulakliklar', 'kulaklik'] },
  ],
  intents: [
    {
      id: 'i-ucz',
      label: 'Uygun fiyatlı',
      terms: ['uygun fiyatli', 'butceye uygun'],
      filter: { priceLevelMax: 2 },
    },
    {
      id: 'i-dnz',
      label: 'Denize yakın',
      terms: ['denize yakin', 'denize sifir'],
      filter: { attributes: { beachfront: true } },
    },
    {
      id: 'i-ozl',
      label: 'Özel gün',
      terms: ['ozel gun'],
      filter: { attributes: { specialOccasion: true } },
    },
  ],
  synonyms: [
    { term: 'araba kiralama', replacement: 'arac kiralama' },
    { term: 'kahvaltici', replacement: 'kahvalti' },
    { term: 'kahvalti', replacement: 'kahvalti mekanlari' },
  ],
  stopPhrases: ['iyi', 'en iyi', 'icin', 'gunluk'],
};

describe('[REQ-ARA-003] [REQ-ARA-006] sorgu ayrıştırıcı', () => {
  it('ekli yer adı, niyet ve kategori filtreye çevrilir (A7.1)', () => {
    const p = parseQuery("Antalya'da denize yakın uygun fiyatlı oteller", lex);
    expect(p.place).toMatchObject({ id: 'p-ant', corrected: false });
    expect(p.category?.slug).toBe('oteller');
    expect(p.intents.map((i) => i.id)).toEqual(['i-dnz', 'i-ucz']);
    expect(p.text).toEqual([]);
    expect(mergeIntentFilters(p.intents)).toEqual({
      priceLevelMax: 2,
      attributes: { beachfront: true },
    });
  });

  it('büyük/küçük harf, İ/I ve aksansız yazım aynı sonucu verir', () => {
    for (const q of [
      "İSTANBUL'DA İYİ KAHVALTI",
      'istanbulda iyi kahvalti',
      'Istanbul iyi kahvaltı',
    ]) {
      const p = parseQuery(q, lex);
      expect(p.place?.id, q).toBe('p-ist');
      expect(p.category?.slug, q).toBe('kahvalti-mekanlari');
      expect(p.text, q).toEqual([]);
    }
  });

  it('en uzun ifade kazanır; eş anlamlılar önce yeniden yazılır', () => {
    expect(parseQuery('İstanbul kahvaltı mekanları', lex).category?.slug).toBe(
      'kahvalti-mekanlari',
    );
    expect(parseQuery("İzmir'de günlük araba kiralama", lex)).toMatchObject({
      place: { id: 'p-izm' },
      category: { slug: 'arac-kiralama' },
      text: [],
    });
    expect(parseQuery('kahvaltıcı kadıköy', lex)).toMatchObject({
      place: { id: 'd-kad' },
      category: { slug: 'kahvalti-mekanlari' },
    });
  });

  it('yer adındaki yazım hatası düzeltilir ve öneri üretilir ("kapadoyka")', () => {
    const p = parseQuery('kapadoyka balon turu', lex);
    expect(p.place).toMatchObject({ id: 'p-nev', corrected: true });
    expect(p.didYouMean).toBe('kapadokya balon turu');
    expect(p.text).toEqual(['balon', 'turu']);
  });

  it('ilçe adlarında yazım toleransı yok; eşleşmeyen kelimeler metin aramasına kalır', () => {
    const p = parseQuery('kadikoi kablosuz kulaklık', lex);
    expect(p.place).toBeNull();
    expect(p.category?.slug).toBe('kulakliklar');
    expect(p.text).toEqual(['kadikoi', 'kablosuz']);
  });

  it('ikinci yer adı filtreye çevrilmez', () => {
    const p = parseQuery('istanbul izmir otel', lex);
    expect(p.place?.id).toBe('p-ist');
    expect(p.text).toEqual(['izmir']);
  });

  it('editDistance bitişik harf yer değiştirmesini tek işlem sayar', () => {
    expect(editDistance('kapadoyka', 'kapadokya')).toBe(1);
    expect(editDistance('izmir', 'izmit')).toBe(1);
    expect(editDistance('', 'abc')).toBe(3);
  });

  it('boş sorgu', () => {
    expect(parseQuery('  ', lex)).toEqual({
      place: null,
      category: null,
      intents: [],
      text: [],
      didYouMean: null,
    });
  });
});
