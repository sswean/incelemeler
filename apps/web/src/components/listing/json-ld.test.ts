import { describe, expect, it } from 'vitest';
import type { PublicListing } from '@incelemeler/contracts';
import { listingJsonLd } from './json-ld';

const base: PublicListing = {
  id: '1',
  kind: 'PLACE',
  slug: 'ornek',
  name: 'Örnek Lokanta',
  status: 'PUBLISHED',
  shortDescription: 'Deniz ürünleri',
  description: null,
  category: { id: 'c', name: 'Restoranlar', slug: 'restoranlar' },
  categoryPath: [
    { name: 'Yeme-İçme', slug: 'yeme-icme' },
    { name: 'Restoranlar', slug: 'restoranlar' },
  ],
  carRental: false,
  priceLevel: 2,
  contacts: { phone: '+90 216 000 00 00' },
  location: {
    province: { name: 'İstanbul', slug: 'istanbul' },
    district: { name: 'Kadıköy', slug: 'kadikoy' },
    neighborhood: null,
    addressLine: 'Örnek Sokak No: 1',
    postalCode: '34710',
    latitude: 40.99,
    longitude: 29.03,
  },
  attributes: [],
  details: {},
  media: [],
  reviewCount: 0,
  dataOrigin: 'EDITORIAL',
  sourceVerifiedAt: null,
  publishedAt: null,
  updatedAt: '2026-10-19T00:00:00.000Z',
};

describe('[REQ-SEO-008] listeleme JSON-LD', () => {
  it('gerçek türle eşleşen tip, adres ve konum; değerlendirme yokken puan işaretlemesi yok', () => {
    const ld = listingJsonLd(base, 'https://x/mekan/ornek', (id) => `https://x/medya/${id}`, true)!;
    expect(ld['@type']).toBe('Restaurant');
    expect(ld.address).toMatchObject({ addressLocality: 'Kadıköy', addressCountry: 'TR' });
    expect(ld.geo).toMatchObject({ latitude: 40.99 });
    expect(ld.priceRange).toBe('₺₺');
    expect(JSON.stringify(ld)).not.toMatch(/aggregateRating|review/i);
  });

  it('demo veride JSON-LD yok (AK-03)', () => {
    expect(listingJsonLd({ ...base, dataOrigin: 'DEMO' }, 'u', (i) => i, true)).toBeNull();
  });

  it('ürün: marka, model, GTIN; adres alanı yok', () => {
    const ld = listingJsonLd(
      {
        ...base,
        kind: 'PRODUCT',
        location: null,
        details: {
          product: { brand: 'Marka', model: 'X1', gtin: '8690000000001', releaseDate: null },
        },
      },
      'u',
      (i) => i,
      false,
    )!;
    expect(ld).toMatchObject({ '@type': 'Product', model: 'X1', gtin: '8690000000001' });
    expect(ld.address).toBeUndefined();
  });
});
