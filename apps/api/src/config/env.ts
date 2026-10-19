import { z } from 'zod';

/** Ortam yapılandırması açılışta doğrulanır (REQ-MIM-018). */
export const EnvSchema = z.object({
  APP_ENV: z.enum(['local', 'test', 'staging', 'production']),
  DATABASE_URL: z.string().url(),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CURSOR_SECRET: z.string().min(32, 'CURSOR_SECRET en az 32 karakter olmalıdır'),
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
  return parsed.data;
}
