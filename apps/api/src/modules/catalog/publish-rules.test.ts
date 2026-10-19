import { describe, expect, it } from 'vitest';
import { type PublishInput, publishBlockers } from './publish-rules.js';

const base: PublishInput = {
  kind: 'PLACE',
  shortDescription: null,
  categoryPublished: true,
  dataOrigin: 'EDITORIAL',
  appEnv: 'local',
  contacts: { phone: '+90 212 000 00 00' },
  location: { districtId: 'd', latitude: 41.0, longitude: 29.0 },
  serviceAreaCount: 0,
  organizationId: null,
  attributes: {},
  attributeDefs: [],
  details: {},
  legal: { required: false, approved: false },
};
const codes = (i: Partial<PublishInput>) => publishBlockers({ ...base, ...i }).map((x) => x.code);

describe('[REQ-LST-001] yayın için zorunlu alanlar (Ek A4.4)', () => {
  it('eksiksiz mekan yayımlanabilir', () => {
    expect(codes({})).toEqual([]);
  });

  it('mekan: koordinat, ilçe ve iletişim kanalı zorunlu', () => {
    expect(codes({ location: null, contacts: {} })).toEqual([
      'location_required',
      'contact_required',
    ]);
    expect(codes({ location: { districtId: null, latitude: null, longitude: null } })).toEqual([
      'coordinates_required',
      'district_required',
    ]);
  });

  it('[REQ-KAT-004] konaklama: turizm belge numarası ve hukuki kapı', () => {
    expect(codes({ kind: 'LODGING', legal: { required: true, approved: false } })).toEqual([
      'legal_gate_closed',
      'license_no_required',
    ]);
    expect(
      codes({
        kind: 'LODGING',
        legal: { required: true, approved: true },
        details: { lodging: { tourismLicenseNo: '12345' } },
      }),
    ).toEqual([]);
  });

  it('ürün: marka/model ve en az 5 teknik özellik', () => {
    expect(codes({ kind: 'PRODUCT', attributes: { a: 1, b: true } })).toEqual([
      'brand_model_required',
      'specs_min_5',
    ]);
    expect(
      codes({
        kind: 'PRODUCT',
        details: { product: { brand: 'Marka', model: 'Model' } },
        attributes: { a: 1, b: true, c: 'x', d: 2.5, e: ['y'] },
      }),
    ).toEqual([]);
  });

  it('turist rehberi: bölge, dil, ruhsat doğrulaması ve açık rıza', () => {
    expect(codes({ kind: 'GUIDE_PERSON' })).toEqual([
      'service_area_required',
      'languages_required',
      'license_verification_required',
      'consent_required',
    ]);
  });

  it('zorunlu özellik, yayında olmayan kategori ve üretimde demo engellenir', () => {
    expect(
      codes({
        categoryPublished: false,
        dataOrigin: 'DEMO',
        appEnv: 'production',
        attributeDefs: [{ key: 'cuisine', required: true }],
      }),
    ).toEqual(['category_not_published', 'demo_in_production', 'attribute_required']);
  });

  it('eser türü Faz 4 — yayımlanamaz', () => {
    expect(codes({ kind: 'WORK', location: null, contacts: {} })).toEqual(['kind_not_available']);
  });
});
