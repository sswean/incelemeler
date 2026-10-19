import { describe, expect, it } from 'vitest';
import { absoluteUrl, listingPath, normalizePath, parseListingPath } from './index.js';

describe('[REQ-SEO-003] URL şeması (Ek A15.1)', () => {
  it('tür önekleri', () => {
    expect(listingPath({ kind: 'PLACE', slug: 'ornek-kahvalti-evi-cihangir' })).toBe(
      '/mekan/ornek-kahvalti-evi-cihangir',
    );
    expect(listingPath({ kind: 'LODGING', slug: 'ornek-butik-otel-goreme' })).toBe(
      '/konaklama/ornek-butik-otel-goreme',
    );
    expect(listingPath({ kind: 'POI', slug: 'kaputas-plaji' })).toBe('/yer/kaputas-plaji');
    expect(listingPath({ kind: 'SERVICE_PROVIDER', slug: 'x', carRental: true })).toBe(
      '/arac-kiralama/x',
    );
    expect(listingPath({ kind: 'GUIDE_PERSON', slug: 'y' })).toBe('/turist-rehberi/y');
  });

  it('yol çözümleme gidiş-dönüş', () => {
    expect(parseListingPath('/urun/marka-model')).toEqual({
      kind: 'PRODUCT',
      slug: 'marka-model',
      carRental: false,
    });
    expect(parseListingPath('/arac-kiralama/x')?.carRental).toBe(true);
    expect(parseListingPath('/bilinmeyen/x')).toBeNull();
    expect(parseListingPath('/mekan')).toBeNull();
  });

  it('normalleştirme: büyük harf, sondaki ve ardışık eğik çizgi', () => {
    expect(normalizePath('/Mekan/Ornek/')).toBe('/mekan/ornek');
    expect(normalizePath('//mekan//ornek')).toBe('/mekan/ornek');
    expect(normalizePath('/mekan/ornek')).toBeNull();
    expect(normalizePath('/')).toBeNull();
  });

  it('mutlak URL', () => {
    expect(absoluteUrl('https://incelemeler.com.tr', '/mekan/a')).toBe(
      'https://incelemeler.com.tr/mekan/a',
    );
    expect(absoluteUrl('https://incelemeler.com.tr/', '/')).toBe('https://incelemeler.com.tr/');
  });
});
