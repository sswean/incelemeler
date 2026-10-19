import { describe, expect, it } from 'vitest';
import { FEATURE_FLAGS, featureEnabled, type FeatureName } from './operations.js';

describe('özellik bayrakları (§12.8)', () => {
  it("[REQ-MIM-017] her bayrak bir REQ'e bağlı; üretimde yalnızca ACIK çalışır; yetenek bayrakları sağlayıcı yokken kapalı", () => {
    for (const [name, f] of Object.entries(FEATURE_FLAGS)) {
      expect(f.req, name).toMatch(/^REQ-[A-Z]{3}-\d{3}$/);
    }
    expect(featureEnabled('sponsorship.placements', 'production')).toBe(true);
    expect(featureEnabled('capabilities.hotelAvailability', 'production')).toBe(false);
    expect(featureEnabled('capabilities.hotelAvailability', 'local')).toBe(false);
    const caps = (Object.keys(FEATURE_FLAGS) as FeatureName[]).filter((n) =>
      n.startsWith('capabilities.'),
    );
    expect(caps.length).toBeGreaterThan(0);
    expect(caps.every((n) => FEATURE_FLAGS[n].state === 'KAPALI')).toBe(true);
  });
});
