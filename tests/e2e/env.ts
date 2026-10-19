const base =
  process.env.E2E_DB_BASE ?? 'postgresql://incelemeler:incelemeler_local_only@localhost:54320';

export const E2E_DATABASE_URL = `${base}/incelemeler_e2e`;
/** Yalnızca E2E: en az yetkili uygulama rolü parolası (gerçek olmayan, her koşuda yeniden atanır — REQ-GUV-011). */
export const E2E_APP_ROLE_PASSWORD = 'e2e-app-role-local-only';
export const E2E_READONLY_ROLE_PASSWORD = 'e2e-readonly-role-local-only';
/** API'nin bağlandığı adres: şema sahibi değil, uygulama rolü. */
export const E2E_APP_DATABASE_URL = (() => {
  const u = new URL(E2E_DATABASE_URL);
  u.username = 'incelemeler_app';
  u.password = E2E_APP_ROLE_PASSWORD;
  return u.toString();
})();
export const API_PORT = 4100;
export const WEB_PORT = 3100;
export const ADMIN_PORT = 3101;
export const MAILPIT_URL = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8025';

/** Yalnızca her koşuda sıfırlanan E2E veritabanındaki test personeli (gerçek hesap değildir). */
export const E2E_STAFF_PASSWORD = 'e2e-panel-test-parolasi-yalnizca-yerel';
export function staffEmail(project: string): string {
  return `e2e-personel-${project}@example.test`;
}
export const E2E_PROJECTS = ['mobile-390', 'desktop-1280'] as const;
