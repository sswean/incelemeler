import { describe, expect, it } from 'vitest';
import {
  AdvertisingApplicationBody,
  ApplicationCreateBody,
  ApplicationDecisionBody,
  isFreeEmailDomain,
} from './applications.js';

const U = '0192f0a0-0000-7000-8000-000000000001';
const business = {
  type: 'BUSINESS',
  businessName: 'Örnek Lokanta',
  kind: 'PLACE',
  categoryId: U,
  provinceId: U,
  address: 'Caferağa Mah. Moda Cad. No: 1',
  contactName: 'Ayşe Yılmaz',
  contactRole: 'İşletme sahibi',
  email: 'Ayse@Ornek.example',
  privacyNoticeAck: true,
  authorityAck: true,
};

describe('hesapsız başvurular', () => {
  it('[REQ-ISL-001] işletme başvurusu: zorunlu alanlar, aydınlatma ve yetki beyanı, adres ya da hizmet bölgesi', () => {
    const ok = ApplicationCreateBody.parse(business);
    expect(ok).toMatchObject({ type: 'BUSINESS', email: 'ayse@ornek.example' });
    expect(ApplicationCreateBody.safeParse({ ...business, privacyNoticeAck: false }).success).toBe(
      false,
    );
    expect(ApplicationCreateBody.safeParse({ ...business, authorityAck: undefined }).success).toBe(
      false,
    );
    const { address: _a, ...noPlace } = business;
    expect(ApplicationCreateBody.safeParse(noPlace).success).toBe(false);
    expect(
      ApplicationCreateBody.safeParse({ ...noPlace, serviceArea: 'İstanbul geneli' }).success,
    ).toBe(true);
    expect(
      ApplicationCreateBody.safeParse({ ...business, website: 'javascript:alert(1)' }).success,
    ).toBe(false);
    expect(ApplicationCreateBody.safeParse({ ...business, role: 'ADMIN' }).success).toBe(false);
  });

  it('[REQ-ISL-002] reklam başvurusu: ürün seçimi zorunlu; ticari ileti izni ayrı ve varsayılan kapalı', () => {
    const base = {
      type: 'ADVERTISING',
      organizationName: 'Örnek Ajans',
      contactName: 'Mehmet Kaya',
      email: 'mehmet@ajans.example',
      products: ['SPONSORED_PLACEMENT'],
      message: 'İzmir kahvaltı mekanları için yerleşim almak istiyoruz.',
      privacyNoticeAck: true,
    };
    expect(AdvertisingApplicationBody.parse(base).marketingConsent).toBe(false);
    expect(ApplicationCreateBody.safeParse({ ...base, products: [] }).success).toBe(false);
    expect(ApplicationCreateBody.safeParse({ ...base, products: ['DISPLAY_AD'] }).success).toBe(
      false,
    );
  });

  it('[REQ-ISL-001] ret gerekçesiz olamaz; kurumsal olmayan e-posta işaretlenir', () => {
    expect(ApplicationDecisionBody.safeParse({ version: 1, decision: 'REJECT' }).success).toBe(
      false,
    );
    expect(
      ApplicationDecisionBody.safeParse({ version: 1, decision: 'REJECT', reason: 'DUPLICATE' })
        .success,
    ).toBe(true);
    expect(isFreeEmailDomain('ayse@gmail.com')).toBe(true);
    expect(isFreeEmailDomain('ayse@ornek.com.tr')).toBe(false);
  });
});
