import { describe, expect, it } from 'vitest';
import { coerceAttribute, distanceMeters, mapHeaders, parseNumber } from './import-rows.js';

describe('[REQ-LST-007] içe aktarma: alan eşleme ve değer çevirme', () => {
  it('Türkçe/İngilizce başlıklar eşlenir; açık eşleme öncelikli; tanınmayanlar raporlanır', () => {
    const { mapping, unmapped } = mapHeaders(
      ['Ad', 'İlçe', 'ENLEM', 'Boylam', 'Firma Notu', 'attr.cuisine', 'attr.yok', 'Telefon No'],
      { 'Telefon No': 'phone' },
      new Set(['cuisine']),
    );
    expect(mapping).toEqual({
      Ad: 'name',
      İlçe: 'district',
      ENLEM: 'latitude',
      Boylam: 'longitude',
      'attr.cuisine': 'attr.cuisine',
      'Telefon No': 'phone',
    });
    expect(unmapped).toEqual(['Firma Notu', 'attr.yok']);
  });

  it('aynı alana ikinci başlık eşlenmez', () => {
    expect(mapHeaders(['ad', 'isim'], {}, new Set()).unmapped).toEqual(['isim']);
  });

  it('ondalık virgül ve özellik tipleri', () => {
    expect(parseNumber('40,9901')).toBe(40.9901);
    expect(parseNumber('')).toBeNull();
    expect(Number.isNaN(parseNumber('kırk'))).toBe(true);
    const options = [
      { value: 'turk', label: 'Türk mutfağı' },
      { value: 'deniz', label: 'Deniz ürünleri' },
    ];
    expect(coerceAttribute({ key: 'b', type: 'BOOL', options: [] }, 'Evet')).toEqual({
      value: true,
    });
    expect(coerceAttribute({ key: 'b', type: 'BOOL', options: [] }, 'HAYIR')).toEqual({
      value: false,
    });
    expect(coerceAttribute({ key: 'c', type: 'ENUM', options }, 'türk mutfağı')).toEqual({
      value: 'turk',
    });
    expect(
      coerceAttribute({ key: 'm', type: 'MULTI_ENUM', options }, 'turk | Deniz ürünleri'),
    ).toEqual({
      value: ['turk', 'deniz'],
    });
    expect(coerceAttribute({ key: 'n', type: 'INT', options: [] }, '2,5').error?.code).toBe(
      'attribute_invalid',
    );
    expect(coerceAttribute({ key: 'c', type: 'ENUM', options }, 'pizza').error?.code).toBe(
      'attribute_invalid',
    );
  });

  it('haversine mesafe (yinelenen tespiti için 150 m eşiği)', () => {
    expect(distanceMeters([40.99, 29.03], [40.99, 29.03])).toBe(0);
    const d = distanceMeters([40.99, 29.03], [40.991, 29.03]);
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(120);
  });
});
