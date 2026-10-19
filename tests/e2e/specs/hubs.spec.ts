import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { WEB_PORT } from '../env.js';
import { expect, test } from '../support/fixtures.js';
import { admin, loginWithMfaSetup } from '../support/admin.js';

const web = `http://localhost:${WEB_PORT}`;

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => v.id);
}

// Eşikler E2E fikstüründe düşük (prepare-db.mjs); kayıtlar kurgusal "(Demo)" verisi.
test.describe('Faz 1 · destinasyon ve keşif hub’ları', () => {
  test('[REQ-SEO-010] [REQ-SEO-011] il × kategori hub: Türkçe ekli başlık, kırıntı, organik liste, iç bağlantı', async ({
    page,
  }) => {
    const res = await page.goto(`${web}/istanbul/kahvalti-mekanlari`);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      "İstanbul'da kahvaltı mekanları",
    );
    const crumbs = page.getByRole('navigation', { name: 'Konum' });
    await expect(crumbs.getByRole('link', { name: 'İstanbul' })).toHaveAttribute(
      'href',
      '/istanbul',
    );
    await expect(page.getByTestId('hub-listings').getByRole('listitem')).toHaveCount(5);
    // Yalnızca demo kayıtlı hub arama motorlarına kapalı ve JSON-LD üretmez (AK-03).
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
    expect(await seriousViolations(page)).toEqual([]);

    await crumbs.getByRole('link', { name: 'İstanbul' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'İstanbul: mekanlar, konaklama ve rehberler',
    );
    await page.getByRole('link', { name: /^Kadıköy \(\d+\)$/ }).click();
    await expect(page).toHaveURL(`${web}/istanbul/kadikoy`);
    await expect(page.getByRole('link', { name: /^Kadıköy · Yeme-İçme \(\d+\)$/ })).toBeVisible();
  });

  test('[REQ-KAT-003] [REQ-SEO-012] eşik altı ve bilinmeyen hub 404; site haritası dizininde hub bölümü', async ({
    page,
  }) => {
    for (const path of [
      '/istanbul/oteller',
      '/istanbul/sisli',
      '/atlantis',
      '/istanbul/kahvalti-mekanlari/kafeler',
    ]) {
      const res = await page.goto(`${web}${path}`);
      expect(res?.status(), path).toBe(404);
    }
    const index = await (await page.request.get(`${web}/sitemap.xml`)).text();
    expect(index).toContain(`${web}/sitemaps/hubs-1.xml`);
    const hubs = await (await page.request.get(`${web}/sitemaps/hubs-1.xml`)).text();
    expect(hubs).not.toContain('/istanbul/kahvalti-mekanlari');
  });

  test('[REQ-KAT-003] yayın eşikleri panelde görüntülenir (kaydetme hubs.int testinde; iki proje aynı kaydı yarıştırmasın)', async ({
    page,
  }, info) => {
    await loginWithMfaSetup(page, `e2e-esik-${info.project.name}@example.test`);
    await page.getByRole('link', { name: 'Yayın eşikleri' }).click();
    await expect(page).toHaveURL(`${admin}/ayarlar/esikler`);
    const form = page.getByRole('form', { name: 'Yayın eşikleri' });
    await expect(form.getByLabel('İlçe × kategori: en az yayımlanmış listeleme')).toHaveValue('2');
    expect(await seriousViolations(page)).toEqual([]);
  });
});
