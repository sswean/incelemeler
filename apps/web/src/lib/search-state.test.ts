import { describe, expect, it } from 'vitest';
import type { SearchInterpretation } from '@incelemeler/contracts';
import {
  activeFilterCount,
  EMPTY_STATE,
  explicitChips,
  interpretationChips,
  parseState,
  relaxHref,
  searchHref,
  toApiQuery,
} from './search-state';

const interpretation: SearchInterpretation = {
  place: {
    name: 'Antalya',
    level: 'PROVINCE',
    province: 'antalya',
    district: null,
    corrected: false,
  },
  category: { slug: 'oteller', name: 'Oteller' },
  intents: [
    { key: 'denize-yakin', label: 'Denize yakın', priceMax: null, attrs: ['beachfront:true'] },
    { key: 'uygun-fiyat', label: 'Uygun fiyatlı', priceMax: 2, attrs: [] },
  ],
  text: null,
  didYouMean: null,
};

describe('[REQ-ARA-012] /ara URL durumu', () => {
  it('URL → durum → URL gidiş-dönüş; geçersiz değerler yok sayılır', () => {
    const s = parseState({
      q: "Antalya'da otel",
      il: 'antalya',
      ilce: 'kas',
      kategori: 'oteller',
      fiyat: '2',
      ozellik: ['beachfront:true', 'beachfront:true', 'kötü değer'],
      sirala: 'newest',
      sayfa: '3',
      tur: 'UNKNOWN',
      puan: '5',
    });
    expect(s).toMatchObject({
      il: 'antalya',
      ilce: 'kas',
      fiyat: 2,
      ozellik: ['beachfront:true'],
      sirala: 'newest',
      sayfa: 3,
      tur: null,
      puan: null,
      yorumla: true,
    });
    expect(
      parseState(Object.fromEntries(new URL(`http://x${searchHref(s)}`).searchParams)),
    ).toEqual({
      ...s,
      ozellik: ['beachfront:true'],
    });
    expect(searchHref(EMPTY_STATE)).toBe('/ara');
    // İlçe il olmadan anlamsız.
    expect(parseState({ ilce: 'kas' }).ilce).toBeNull();
  });

  it('API parametrelerine çeviri (bilinmeyen parametre üretmez)', () => {
    const s = parseState({
      q: 'kahvaltı',
      il: 'istanbul',
      ozellik: 'familyFriendly:true',
      yorumla: 'hayir',
    });
    expect(toApiQuery(s)).toEqual({
      q: 'kahvaltı',
      province: 'istanbul',
      attr: ['familyFriendly:true'],
      interpret: 'false',
    });
    expect(activeFilterCount(s)).toBe(2);
  });

  it('[REQ-ARA-007] yorum çipi kaldırılınca kalan yorum açık filtreye yazılır, ayrıştırma kapanır', () => {
    const s = parseState({ q: "Antalya'da denize yakın uygun fiyatlı oteller" });
    const chips = interpretationChips(s, interpretation, { price: (n) => '₺'.repeat(n) });
    expect(chips.map((c) => c.label)).toEqual(['Antalya', 'Oteller', 'Denize yakın', '₺₺']);
    const withoutPlace = parseState(
      Object.fromEntries(new URL(`http://x${chips[0]!.href}`).searchParams.entries()),
    );
    expect(withoutPlace).toMatchObject({
      q: '',
      il: null,
      kategori: 'oteller',
      fiyat: 2,
      ozellik: ['beachfront:true'],
      yorumla: false,
    });
  });

  it('açık filtre çipleri ve sıfır sonuç gevşetme bağlantıları', () => {
    const s = parseState({ il: 'istanbul', ilce: 'kadikoy', kategori: 'kafeler' });
    const chips = explicitChips(s, { ozellik: (a) => a });
    expect(chips.find((c) => c.id === 'il')!.href).toBe('/ara?kategori=kafeler');
    const relaxed = relaxHref(
      parseState({ q: 'trabzon kahvaltı' }),
      {
        ...interpretation,
        place: {
          name: 'Trabzon',
          level: 'PROVINCE',
          province: 'trabzon',
          district: null,
          corrected: false,
        },
        category: { slug: 'kahvalti-mekanlari', name: 'Kahvaltı Mekanları' },
        intents: [],
      },
      'place',
    );
    expect(relaxed).toBe('/ara?kategori=kahvalti-mekanlari&yorumla=hayir');
  });

  it('[REQ-VER-010] "Şu an açık" filtresi: URL acik=1, API openNow, çip ve gevşetme', () => {
    const s = parseState({ kategori: 'kafeler', acik: '1' });
    expect(s.acik).toBe(true);
    expect(parseState({ acik: 'evet' }).acik).toBe(false);
    expect(toApiQuery(s)).toMatchObject({ category: 'kafeler', openNow: 'true' });
    expect(searchHref(s)).toBe('/ara?kategori=kafeler&acik=1');
    expect(activeFilterCount(s)).toBe(2);
    const chip = explicitChips(s, { ozellik: (a) => a, acik: 'Şu an açık' }).find(
      (c) => c.id === 'acik',
    )!;
    expect(chip).toMatchObject({ label: 'Şu an açık', href: '/ara?kategori=kafeler' });
    expect(
      relaxHref(s, { ...interpretation, place: null, category: null, intents: [] }, 'openNow'),
    ).toBe('/ara?kategori=kafeler&yorumla=hayir');
  });
});
