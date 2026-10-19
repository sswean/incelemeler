import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../support/fixtures.js';
import { WEB_PORT } from '../env.js';

const web = `http://localhost:${WEB_PORT}`;

test.describe('Faz 1 · listeleme detay sayfası ve SEO temeli', () => {
  test('[REQ-SEO-001] [REQ-SEO-002] [REQ-SEO-004] [REQ-SEO-008] [REQ-SEO-010] @smoke detay sayfası: SSR içerik, başlık, canonical, JSON-LD, kırıntı yolu', async ({
    page,
    request,
  }) => {
    // JS olmadan sunucu HTML'i birincil içeriği içerir.
    const html = await (await request.get(`${web}/mekan/e2e-test-lokantasi`)).text();
    expect(html).toContain('E2E Test Lokantası');
    // Değerlendirme yokken boş durum (A6.2) sunucu HTML'inde; sahte puan yok.
    expect(html).toContain('Henüz değerlendirme yok');
    expect(html).not.toContain('aggregateRating');

    await page.goto(`${web}/mekan/e2e-test-lokantasi`);
    await expect(page).toHaveTitle('E2E Test Lokantası – Kadıköy, İstanbul · İncelemeler');
    expect((await page.title()).length).toBeLessThanOrEqual(75);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Uçtan uca testler için kurgusal bir lokanta kaydı.',
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${web}/mekan/e2e-test-lokantasi`,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');

    const ld = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) =>
        els.map((e) => JSON.parse(e.textContent ?? '{}') as Record<string, unknown>),
      );
    const business = ld.find((x) => x['@type'] === 'Restaurant')!;
    expect(business).toMatchObject({
      name: 'E2E Test Lokantası',
      url: `${web}/mekan/e2e-test-lokantasi`,
      priceRange: '₺₺',
      address: { addressLocality: 'Kadıköy', addressRegion: 'İstanbul', addressCountry: 'TR' },
    });
    expect(JSON.stringify(ld)).not.toMatch(/aggregateRating/i);
    expect(ld.find((x) => x['@type'] === 'BreadcrumbList')).toBeTruthy();
    await expect(page.getByRole('navigation', { name: 'Konum' })).toContainText('Restoranlar');

    // İlk ekran (REQ-LST-003): ad, kategori, konum, puan özeti, fiyat seviyesi, birincil CTA.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('E2E Test Lokantası');
    await expect(page.getByTestId('listing-ctas').getByRole('link').first()).toHaveAccessibleName(
      'Yol tarifi al (yeni sekmede açılır)',
    );
    await expect(page.getByRole('img', { name: 'Görsel henüz eklenmedi' })).toBeVisible();
    await expect(page.getByTestId('verified-at')).toContainText(
      'tarihinde doğrulandı; değişmiş olabilir.',
    );
    const axe = await new AxeBuilder({ page }).analyze();
    expect(
      axe.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => v.id),
    ).toEqual([]);
  });

  test('[REQ-VER-013] [REQ-SEO-003] [REQ-SEO-012] @smoke 301 (eski slug, yanlış önek, büyük harf, sondaki eğik çizgi), 410 ve 404', async ({
    request,
  }) => {
    const get = (path: string) => request.get(`${web}${path}`, { maxRedirects: 0 });
    for (const [path, target] of [
      ['/mekan/e2e-eski-lokanta', '/mekan/e2e-test-lokantasi'],
      ['/konaklama/e2e-test-lokantasi', '/mekan/e2e-test-lokantasi'],
      ['/Mekan/E2E-Test-Lokantasi', '/mekan/e2e-test-lokantasi'],
      ['/mekan/e2e-test-lokantasi/', '/mekan/e2e-test-lokantasi'],
    ] as const) {
      const res = await get(path);
      expect(res.status(), path).toBe(301);
      expect(new URL(res.headers().location!, web).pathname, path).toBe(target);
    }
    expect((await get('/mekan/e2e-kaldirilan-lokanta')).status()).toBe(410);
    expect((await get('/mekan/hic-olmayan-lokanta')).status()).toBe(404);
  });

  test('[REQ-LST-006] kapalı listeleme: sayfa 200, durum bandı, CTA yok', async ({ page }) => {
    const res = await page.goto(`${web}/mekan/e2e-kapanan-lokanta`);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('status')).toContainText('Kalıcı olarak kapandı');
    await expect(page.getByTestId('listing-ctas')).toHaveCount(0);
  });

  test('[REQ-SEO-006] [REQ-SEO-007] [REQ-VER-018] site haritası ve robots.txt: demo, kapalı ve kaldırılan yok; demo sayfası noindex', async ({
    request,
    page,
  }) => {
    const index = await (await request.get(`${web}/sitemap.xml`)).text();
    expect(index).toContain(`${web}/sitemaps/listings-1.xml`);
    const listings = await (await request.get(`${web}/sitemaps/listings-1.xml`)).text();
    expect(listings).toContain(`${web}/mekan/e2e-test-lokantasi`);
    expect(listings).not.toContain('ornek-lokanta-demo');
    expect(listings).not.toContain('e2e-kapanan-lokanta');
    expect(listings).not.toContain('e2e-kaldirilan-lokanta');

    const robots = await (await request.get(`${web}/robots.txt`)).text();
    expect(robots).toContain('Disallow: /git/');
    expect(robots).toContain(`Sitemap: ${web}/sitemap.xml`);

    await page.goto(`${web}/mekan/ornek-lokanta-demo`);
    await expect(page.getByRole('note')).toContainText('kurgusal bir demo');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  });
});
