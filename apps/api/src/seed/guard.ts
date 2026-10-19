/** Seed komutları üretimde çalışmayı reddeder (§12.4, AK-03). */
export class SeedRefusedError extends Error {}

export function assertSeedAllowed(appEnv: string | undefined): void {
  if (appEnv === undefined || appEnv === '') {
    throw new SeedRefusedError('APP_ENV tanımsız; seed çalıştırılmadı.');
  }
  if (appEnv === 'production') {
    throw new SeedRefusedError('Seed üretim ortamında (APP_ENV=production) çalıştırılamaz.');
  }
}
