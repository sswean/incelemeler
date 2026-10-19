import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ADMIN_PORT, WEB_PORT } from '../env.js';

const web = `http://localhost:${WEB_PORT}`;
const admin = `http://localhost:${ADMIN_PORT}`;

test.describe('Faz 0 yürüyen iskelet', () => {
  test('[REQ-MIM-001] @smoke ana sayfa kategorileri API → PostgreSQL üzerinden gösterir', async ({
    page,
  }) => {
    await page.goto(web);
    await expect(page).toHaveTitle(/İncelemeler/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Ne keşfetmek istiyorsun?' }),
    ).toBeVisible();
    const grid = page.getByTestId('category-grid');
    await expect(grid.getByText('Yeme-İçme')).toBeVisible();
    await expect(grid.getByText('Konaklama')).toBeVisible();
    await expect(grid.getByRole('listitem')).toHaveCount(9);
  });

  test('[REQ-SEO-001] @smoke içerik sunucu tarafında render edilir (JS olmadan)', async ({
    request,
  }) => {
    const res = await request.get(web);
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain('Ne keşfetmek istiyorsun?');
    expect(html).toContain('Yeme-İçme');
  });

  test('[REQ-ERS-002] ana sayfada ciddi/kritik erişilebilirlik ihlali yok', async ({ page }) => {
    await page.goto(web);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious.map((v) => v.id)).toEqual([]);
  });

  test('[REQ-TST-003] yatay kaydırma yok', async ({ page }) => {
    await page.goto(web);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('[REQ-ADM-001] @smoke panel noindex; oturumsuz ziyaretçi giriş sayfasına yönlenir', async ({
    page,
  }) => {
    // Sistem durumunun gerçek veriyle gösterimi, giriş + 2FA sonrası admin-auth.spec.ts'de doğrulanır.
    const res = await page.goto(admin);
    expect(res?.headers()['x-robots-tag']).toContain('noindex');
    await expect(page).toHaveURL(`${admin}/giris`);
    await expect(page.getByRole('heading', { level: 1, name: 'Personel girişi' })).toBeVisible();
  });
});
