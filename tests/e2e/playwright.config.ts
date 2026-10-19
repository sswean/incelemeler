import { defineConfig, devices } from '@playwright/test';
import { ADMIN_PORT, API_PORT, E2E_DATABASE_URL, MAILPIT_URL, WEB_PORT } from './env.js';

const apiUrl = `http://localhost:${API_PORT}`;

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  reporter: [['list']],
  use: { trace: 'retain-on-failure' },
  projects: [
    {
      name: 'mobile-390',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'desktop-1280',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: [
    {
      command: 'node dist/main.js',
      cwd: '../../apps/api',
      url: `${apiUrl}/v1/health`,
      reuseExistingServer: false,
      env: {
        APP_ENV: 'test',
        DATABASE_URL: E2E_DATABASE_URL,
        API_PORT: String(API_PORT),
        CURSOR_SECRET: 'e2e-cursor-secret-not-a-real-secret-0000',
        // Yalnızca E2E: sabit, gerçek olmayan test anahtarı (her koşuda sıfırlanan veritabanı).
        DATA_ENCRYPTION_KEY: 'e2'.repeat(32),
        EMAIL_ADAPTER: 'mailpit',
        S3_ENDPOINT: process.env.E2E_S3_ENDPOINT ?? 'http://localhost:8333',
        S3_BUCKET: 'incelemeler-e2e',
        MAILPIT_URL,
        WEB_BASE_URL: `http://localhost:${WEB_PORT}`,
        ADMIN_BASE_URL: `http://localhost:${ADMIN_PORT}`,
      },
    },
    {
      command: `pnpm exec next start --port ${WEB_PORT}`,
      cwd: '../../apps/web',
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false,
      // E2E: indeksleme kurallarını test etmek için açık (yerel, atılan sunucu).
      env: {
        API_INTERNAL_URL: apiUrl,
        SITE_URL: `http://localhost:${WEB_PORT}`,
        SITE_INDEXING: 'on',
      },
    },
    {
      command: `pnpm exec next start --port ${ADMIN_PORT}`,
      cwd: '../../apps/admin',
      url: `http://localhost:${ADMIN_PORT}`,
      reuseExistingServer: false,
      env: { API_INTERNAL_URL: apiUrl, WEB_BASE_URL: `http://localhost:${WEB_PORT}` },
    },
  ],
});
