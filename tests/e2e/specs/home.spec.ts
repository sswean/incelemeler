import AxeBuilder from '@axe-core/playwright';
import { WEB_PORT } from '../env.js';
import { expect, test } from '../support/fixtures.js';
import { admin, loginWithMfaSetup } from '../support/admin.js';

const web = `http://localhost:${WEB_PORT}`;

test.describe('Faz 1 · ana sayfa modülleri', () => {
  test('[REQ-ADM-006] arama en üstte; modüller sırayla; şehir seçimi bağlamı değiştirir', async ({
    page,
  }) => {
    await page.goto(`${web}/`);
    const main = page.getByRole('main');
    await expect(
      main.getByRole('heading', { level: 1, name: 'Ne keşfetmek istiyorsun?' }),
    ).toBeVisible();
    await expect(main.getByRole('combobox', { name: 'Ne arıyorsun?' })).toBeVisible();
    await expect(page.getByTestId('category-grid').getByRole('listitem')).toHaveCount(9);
    // Arama kutusunun üstünde sponsorlu öğe yok.
    await expect(page.getByTestId('sponsored-card')).toHaveCount(0);

    const cities = page.getByTestId('home-module-sehrini-sec');
    await expect(cities.getByRole('heading', { name: 'Şehrini seç' })).toBeVisible();
    await cities.getByRole('link', { name: 'İstanbul', exact: true }).click();
    await expect(page).toHaveURL(`${web}/?il=istanbul`);
    await expect(page.getByTestId('city-context')).toHaveText(
      'İstanbul için öneriler · Tüm şehirler',
    );
    const food = page.getByTestId('home-module-sehirde-populer-yeme-icme');
    await expect(food.getByRole('listitem').first()).toContainText('İstanbul');
    for (const item of await food.getByRole('listitem').all()) {
      await expect(item).toContainText('İstanbul');
    }
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => v.id),
    ).toEqual([]);
  });

  test('[REQ-ADM-006] [REQ-SPN-004] panel: sponsorlu modül ilk ekrana alınamaz; önizleme yayındaki durumu gösterir', async ({
    page,
  }, info) => {
    await loginWithMfaSetup(page, `e2e-anasayfa-${info.project.name}@example.test`);
    await page.goto(`${admin}/ana-sayfa`);
    await expect(page.getByTestId('home-preview')).toContainText('Şehrini seç');
    const form = page.getByRole('form', { name: 'Sponsorlu modül: Sponsorlu öneriler' });
    await form.getByLabel('Sıra').fill('5');
    await form.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'Sponsorlu modül ilk üç modül arasında olamaz.',
    );
  });
});
