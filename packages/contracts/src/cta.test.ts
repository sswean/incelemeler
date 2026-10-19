import { describe, expect, it } from 'vitest';
import { CTA_RULES, ctasFor } from './cta.js';
import { ListingKind } from './taxonomy.js';

describe('[REQ-LST-001] CTA tablosu (Ek A4.4)', () => {
  it('hiçbir türde izinli ve yasak listeler kesişmez', () => {
    for (const kind of ListingKind.options) {
      const { allowed, forbidden } = CTA_RULES[kind];
      expect(
        allowed.filter((a) => forbidden.includes(a)),
        kind,
      ).toEqual([]);
    }
  });

  it('bağlamsız eylem yok: mekanda satın alma/bilet/araç kiralama, üründe yol tarifi/arama yok', () => {
    expect(CTA_RULES.PLACE.forbidden).toEqual(
      expect.arrayContaining(['BUY', 'TICKETS', 'CAR_RENTAL']),
    );
    expect(CTA_RULES.PRODUCT.forbidden).toEqual(
      expect.arrayContaining(['DIRECTIONS', 'CALL', 'RESERVATION']),
    );
    expect(CTA_RULES.WORK.forbidden).toEqual(expect.arrayContaining(['RESERVATION', 'CAR_RENTAL']));
  });

  it('yalnızca verisi olan izinli eylemler; rezervasyon bağlantısı yoksa rezervasyon yok', () => {
    const base = { kind: 'PLACE' as const, status: 'PUBLISHED', hasCoordinates: true };
    expect(ctasFor({ ...base, phone: '+90 212 000 00 00' })).toEqual(['DIRECTIONS', 'CALL']);
    expect(
      ctasFor({
        ...base,
        phone: '1',
        reservationUrl: 'https://r.example',
        website: 'https://w.example',
      }),
    ).toEqual(['DIRECTIONS', 'CALL', 'RESERVATION', 'WEBSITE']);
    expect(
      ctasFor({ kind: 'PRODUCT', status: 'PUBLISHED', hasCoordinates: true, phone: '1' }),
    ).toEqual([]);
  });

  it('[REQ-LST-006] kapalı listelemede CTA yok', () => {
    expect(
      ctasFor({ kind: 'PLACE', status: 'CLOSED_PERMANENTLY', hasCoordinates: true, phone: '1' }),
    ).toEqual([]);
  });
});
