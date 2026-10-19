import { describe, expect, it } from 'vitest';
import { AnalyticsEventBody } from './analytics.js';

const base = { sessionId: '0b6f3c1e-5d2a-4f7b-9c8e-1a2b3c4d5e6f', path: '/mekan/ornek' };

describe('[REQ-ANL-002] olay sözlüğü doğrulaması', () => {
  it('sözlükteki olay ve özellikler kabul edilir', () => {
    expect(
      AnalyticsEventBody.safeParse({
        ...base,
        name: 'listing_viewed',
        props: { listingId: base.sessionId, kind: 'PLACE' },
      }).success,
    ).toBe(true);
  });
  it('sözlük dışı olay, yanlış özellik ve sorgu dizeli yol reddedilir (kişisel veri sızmasın)', () => {
    expect(AnalyticsEventBody.safeParse({ ...base, name: 'email_seen', props: {} }).success).toBe(
      false,
    );
    expect(
      AnalyticsEventBody.safeParse({
        ...base,
        name: 'landing',
        props: { source: 'google.com/q=ad' },
      }).success,
    ).toBe(false);
    expect(
      AnalyticsEventBody.safeParse({
        ...base,
        path: '/ara?q=telefonum',
        name: 'landing',
        props: { source: 'direct' },
      }).success,
    ).toBe(false);
  });
});
