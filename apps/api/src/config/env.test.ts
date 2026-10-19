import { describe, expect, it } from 'vitest';
import { EnvValidationError, loadEnv } from './env.js';

const valid = {
  APP_ENV: 'local',
  DATABASE_URL: 'postgresql://u:supersecretpw@localhost:5432/db',
  CURSOR_SECRET: 'x'.repeat(32),
  DATA_ENCRYPTION_KEY: 'a'.repeat(64),
};

describe('[REQ-MIM-018] ortam doğrulama', () => {
  it('geçerli ortamı kabul eder ve varsayılan port verir', () => {
    expect(loadEnv(valid).API_PORT).toBe(4000);
  });
  it('eksik değişkenin adını yazar, değerini yazmaz', () => {
    const fn = () => loadEnv({ ...valid, CURSOR_SECRET: 'kisa' });
    expect(fn).toThrow(EnvValidationError);
    expect(fn).toThrow(/CURSOR_SECRET/);
    try {
      loadEnv({ ...valid, APP_ENV: 'bogus' });
    } catch (e) {
      expect(String(e)).not.toContain('supersecretpw');
    }
  });
});

describe('[REQ-MIM-018] üretim koruması', () => {
  it('üretimde yerel e-posta yakalayıcı reddedilir (§12.8)', () => {
    expect(() => loadEnv({ ...valid, APP_ENV: 'production', EMAIL_ADAPTER: 'mailpit' })).toThrow(
      EnvValidationError,
    );
  });
  it('üretimde bellek depolama adaptörü reddedilir (§12.8)', () => {
    expect(() => loadEnv({ ...valid, APP_ENV: 'production', STORAGE_ADAPTER: 'memory' })).toThrow(
      EnvValidationError,
    );
  });
});
