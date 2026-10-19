import { describe, expect, it } from 'vitest';
import { assessReview, isValidTckn, type SignalContext } from './review-signals.js';

const base: SignalContext = {
  title: null,
  body: 'Kahvaltı tabağı doyurucuydu, servis hızlıydı ve masalar temizdi. Tekrar gelirim.',
  accountAgeDays: 400,
  approvedReviewCount: 10,
  recentByUser24h: 0,
  recentByIp24h: 0,
  listingReviews24h: 0,
  maxSimilarity: 0,
  userEmailDomain: 'example.com',
  listingWebsiteDomain: null,
  ymyl: false,
};
const codes = (ctx: Partial<SignalContext>) =>
  assessReview({ ...base, ...ctx }).signals.map((s) => s.code);

describe('[REQ-GUN-001] otomatik moderasyon sinyalleri (Ek A6.6)', () => {
  it('güvenilir hesabın temiz metni son moderasyonla yayımlanır', () => {
    expect(assessReview(base)).toEqual({ riskScore: 0, signals: [], preModeration: false });
  });

  it('ilk 3 onaylı değerlendirmeye kadar ön moderasyon', () => {
    const a = assessReview({ ...base, approvedReviewCount: 2 });
    expect(a.preModeration).toBe(true);
    expect(a.signals.map((s) => s.code)).toEqual(['FEW_APPROVED']);
  });

  it('kişisel veri kalıpları: telefon, e-posta, IBAN, plaka, geçerli T.C. kimlik no', () => {
    expect(codes({ body: `${base.body} Bana 0532 123 45 67 numarasından ulaşın.` })).toContain(
      'PERSONAL_DATA',
    );
    expect(codes({ body: `${base.body} yazin: ali@ornek.example` })).toContain('PERSONAL_DATA');
    expect(codes({ body: `${base.body} TR33 0006 1005 1978 6457 8413 26` })).toContain(
      'PERSONAL_DATA',
    );
    expect(codes({ body: `${base.body} Garsonun arabası 34 ABC 1234 idi.` })).toContain(
      'PERSONAL_DATA',
    );
    expect(isValidTckn('10000000146')).toBe(true);
    expect(isValidTckn('12345678901')).toBe(false);
    expect(codes({ body: `${base.body} kimlik 10000000146` })).toContain('PERSONAL_DATA');
    expect(codes({ body: `${base.body} sipariş no 12345678901` })).not.toContain('PERSONAL_DATA');
    expect(assessReview({ ...base, body: `${base.body} 0532 123 45 67` }).preModeration).toBe(true);
  });

  it('küfür tam kelime ve aksansız eşleşir; bağlantı ve sağlık iddiası', () => {
    expect(codes({ body: `${base.body} Garson tam bir ŞEREFSİZ.` })).toContain('PROFANITY');
    expect(codes({ body: `${base.body} Picasso tablosu vardı.` })).not.toContain('PROFANITY');
    expect(codes({ body: `${base.body} Ayrıntı: www.ornek-indirim.com` })).toContain('LINK');
    const health = assessReview({
      ...base,
      body: `${base.body} Buranın çayı migrenimi tedavi etti.`,
    });
    expect(health.signals.map((s) => s.code)).toContain('HEALTH_CLAIM');
    expect(health.preModeration).toBe(true);
  });

  it('hız, yinelenen metin, işletmeyle ilişkili hesap ve YMYL; eşik aşılırsa ön moderasyon', () => {
    const a = assessReview({
      ...base,
      recentByUser24h: 4,
      maxSimilarity: 0.92,
      userEmailDomain: 'ornekotel.com.tr',
      listingWebsiteDomain: 'ornekotel.com.tr',
    });
    expect(a.signals.map((s) => s.code)).toEqual([
      'DUPLICATE_TEXT',
      'VELOCITY_ACCOUNT',
      'BUSINESS_RELATED',
    ]);
    expect(a.riskScore).toBe(100);
    expect(a.preModeration).toBe(true);
    expect(assessReview({ ...base, ymyl: true }).preModeration).toBe(true);
    // Tek başına yeni hesap sinyali ceza vermez.
    expect(assessReview({ ...base, accountAgeDays: 1 })).toMatchObject({
      riskScore: 10,
      preModeration: false,
    });
  });
});
