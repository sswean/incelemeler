import { WEB_PORT } from '../env.js';
import { expect, test } from '../support/fixtures.js';

const web = `http://localhost:${WEB_PORT}`;
const PUBLIC = [
  '/',
  '/ara?q=simit',
  '/istanbul/kahvalti-mekanlari',
  '/mekan/ornek-moda-ocakbasi-demo',
];

test.describe('Faz 1 · misafir gezinme', () => {
  test('[REQ-HSP-001] [REQ-SEO-013] misafir giriş duvarı olmadan gezer; giriş yalnızca eylemde istenir', async ({
    page,
  }) => {
    for (const path of PUBLIC) {
      const res = await page.goto(`${web}${path}`);
      expect(res?.status(), path).toBe(200);
      await expect(page, path).toHaveURL(`${web}${path}`);
      await expect(page.locator('html'), path).toHaveAttribute('lang', 'tr');
      // Tek dil yayındayken hreflang üretilmez (REQ-SEO-013).
      await expect(page.locator('link[rel="alternate"][hreflang]'), path).toHaveCount(0);
    }
    await page.goto(`${web}/mekan/ornek-moda-ocakbasi-demo`);
    await page.getByTestId('favorite-button').click();
    await expect(page).toHaveURL(/\/giris\?sonra=%2Fmekan%2Fornek-moda-ocakbasi-demo/);
  });

  test('[REQ-LST-010] [REQ-ERS-007] listelemede "Hakkında" bloğu; otomatik oynayan karusel ya da medya yok', async ({
    page,
  }) => {
    await page.goto(`${web}/mekan/ornek-moda-ocakbasi-demo`);
    const about = page.getByRole('region', { name: 'Hakkında' });
    await expect(about).toBeVisible();
    await expect(about.locator('p').first()).not.toBeEmpty();
    for (const path of PUBLIC) {
      await page.goto(`${web}${path}`);
      await expect(page.locator('[aria-roledescription="carousel"]'), path).toHaveCount(0);
      await expect(page.locator('video[autoplay], audio[autoplay], marquee'), path).toHaveCount(0);
    }
  });
});
