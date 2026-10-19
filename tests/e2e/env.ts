const base =
  process.env.E2E_DB_BASE ?? 'postgresql://incelemeler:incelemeler_local_only@localhost:54320';

export const E2E_DATABASE_URL = `${base}/incelemeler_e2e`;
export const API_PORT = 4100;
export const WEB_PORT = 3100;
export const ADMIN_PORT = 3101;
