import { z } from 'zod';

/** Ortam yapılandırması açılışta doğrulanır (REQ-MIM-018). */
export const EnvSchema = z.object({
  APP_ENV: z.enum(['local', 'test', 'staging', 'production']),
  DATABASE_URL: z.string().url(),
  API_PORT: z.coerce.number().int().min(0).max(65535).default(4000),
  CURSOR_SECRET: z.string().min(32, 'CURSOR_SECRET en az 32 karakter olmalıdır'),
  /** AES-256-GCM anahtarı (64 hex karakter) — MFA sırları vb. (REQ-GUV-010) */
  DATA_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, 'DATA_ENCRYPTION_KEY 64 hex karakter olmalıdır'),
  /** E-posta adaptörü: mailpit (yerel yakalayıcı), memory (test), disabled (sağlayıcı yok — X-004) */
  EMAIL_ADAPTER: z.enum(['mailpit', 'memory', 'disabled']).default('disabled'),
  MAILPIT_URL: z.string().url().default('http://localhost:8025'),
  EMAIL_FROM: z.string().email().default('noreply@incelemeler.local'),
  WEB_BASE_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_BASE_URL: z.string().url().default('http://localhost:3001'),
  /** Medya depolama: s3 (S3 uyumlu; yerelde SeaweedFS) ya da memory (yalnızca test). */
  STORAGE_ADAPTER: z.enum(['s3', 'memory']).default('s3'),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().min(3).default('incelemeler-media'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  /** Express "trust proxy" (web/admin BFF'nin istemci IP'sini iletmesi için). */
  TRUST_PROXY: z.string().default('loopback'),
  /** Rota sınıfı hız sınırlarının çarpanı (A-029); üretimde 1. Testler yüksek hacimli senaryolar için artırabilir. */
  RATE_LIMIT_MULTIPLIER: z.coerce.number().int().min(1).max(1000).default(1),
  /** Yerel/E2E kolaylığı: outbox işleyicisini API sürecinde de çalıştır (üretimde ayrı worker). */
  RUN_WORKER_IN_PROCESS: z.enum(['true', 'false']).default('false'),
});
export type Env = z.infer<typeof EnvSchema>;

export class EnvValidationError extends Error {}

/** Eksik/geçersiz değişkenlerin yalnızca ADLARINI bildirir; değerleri asla yazmaz (§13.1). */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const names = [...new Set(parsed.error.issues.map((i) => i.path.join('.')))].sort();
    throw new EnvValidationError(`Geçersiz ya da eksik ortam değişkenleri: ${names.join(', ')}`);
  }
  if (parsed.data.APP_ENV === 'production' && parsed.data.EMAIL_ADAPTER !== 'disabled') {
    // Yerel yakalayıcı/bellek adaptörü üretimde kullanılamaz (§12.8).
    throw new EnvValidationError(
      'EMAIL_ADAPTER üretimde yalnızca gerçek sağlayıcı ya da disabled olabilir',
    );
  }
  if (parsed.data.APP_ENV === 'production' && parsed.data.RATE_LIMIT_MULTIPLIER !== 1) {
    throw new EnvValidationError('RATE_LIMIT_MULTIPLIER üretimde 1 olmalıdır');
  }
  if (parsed.data.APP_ENV === 'production' && parsed.data.STORAGE_ADAPTER === 'memory') {
    throw new EnvValidationError('STORAGE_ADAPTER=memory üretimde kullanılamaz');
  }
  return parsed.data;
}
