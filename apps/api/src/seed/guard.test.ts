import { describe, expect, it } from 'vitest';
import { assertSeedAllowed, SeedRefusedError } from './guard.js';

describe('[REQ-VER-018] seed üretimde reddeder (§12.4)', () => {
  it('production reddedilir', () => {
    expect(() => assertSeedAllowed('production')).toThrow(SeedRefusedError);
  });
  it('tanımsız ortam reddedilir', () => {
    expect(() => assertSeedAllowed(undefined)).toThrow(SeedRefusedError);
  });
  it('local ve test kabul edilir', () => {
    expect(() => assertSeedAllowed('local')).not.toThrow();
    expect(() => assertSeedAllowed('test')).not.toThrow();
  });
});
