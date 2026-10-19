import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { WEB_PORT } from '../env.js';
import { expect, test } from '../support/fixtures.js';

const web = `http://localhost:${WEB_PORT}`;

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => v.id);
}

/** Mobilde panel kapalı başlar; rozetli düğmeyle alt sayfa (dialog) olarak açılır. Masaüstünde yan sütun. */
async function openFilters(page: Page, mobile: boolean) {
  if (mobile) await page.getByRole('button', { name: 'Filtreler (1)' }).click();
}

test.describe('Faz 1 · arama ve filtreler', () => {
  test('[REQ-ARA-007] [REQ-ARA-012] misafir ana sayfadan arar; yorum çipleri görünür; sonuçtan listelemeye gider', async ({
    page,
  }) => {
    await page.goto(web);
    await page.getByRole('combobox', { name: 'Ne arıyorsun?' }).fill("İzmir'de kahvaltı");
    await page.getByRole('combobox', { name: 'Ne arıyorsun?' }).press('Enter');
    await expect(page).toHaveURL(/\/ara\?q=/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    const results = page.getByRole('heading', { level: 2, name: /için 2 sonuç/ });
    await expect(results).toBeVisible();
    const chips = page.getByRole('list', { name: 'Filtreler' });
    await expect(chips.getByRole('link', { name: 'İzmir filtresini kaldır' })).toBeVisible();
    await expect(
      chips.getByRole('link', { name: 'Kahvaltı Mekanları filtresini kaldır' }),
    ).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);

    // Yer çipini kaldır: kategori açık filtre olarak kalır, yorum kapanır.
    await chips.getByRole('link', { name: 'İzmir filtresini kaldır' }).click();
    await expect(page).toHaveURL(/kategori=kahvalti-mekanlari/);
    await expect(page).toHaveURL(/yorumla=hayir/);
    await expect(page.getByTestId('search-hit')).toHaveCount(8);
    // Geri tuşu önceki aramaya döner.
    await page.goBack();
    await expect(page.getByRole('heading', { level: 2, name: /için 2 sonuç/ })).toBeVisible();

    await page.getByRole('link', { name: 'Örnek Kordon Kahvaltıcısı (Demo)' }).click();
    await expect(page).toHaveURL(`${web}/mekan/ornek-kordon-kahvalticisi-demo`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Örnek Kordon Kahvaltıcısı (Demo)',
    );
  });

  test('[REQ-ARA-010] otomatik tamamlama klavyeyle gezilir (ARIA combobox)', async ({ page }) => {
    await page.goto(`${web}/ara`);
    const box = page.getByRole('combobox', { name: 'Ne arıyorsun?' });
    await box.fill('uskud');
    const listbox = page.getByRole('listbox', { name: 'Ne arıyorsun?' });
    await expect(listbox.getByRole('option', { name: /Üsküdar/ }).first()).toBeVisible();
    await expect(box).toHaveAttribute('aria-expanded', 'true');
    await box.press('ArrowDown');
    await expect(box).toHaveAttribute('aria-activedescendant', /o0$/);
    await box.press('Enter');
    await expect(page).toHaveURL(`${web}/ara?il=istanbul&ilce=uskudar`);
    await expect(page.getByTestId('search-hit')).toHaveCount(2);
  });

  test('[REQ-ARA-012] filtre paneli: mobilde alt sayfa, rozet ve canlı sonuç sayısı; URL filtreyi yansıtır', async ({
    page,
  }, info) => {
    await page.goto(`${web}/ara?il=antalya`);
    const panel = page.locator('#filtre-paneli');
    const mobile = info.project.name === 'mobile-390';
    await openFilters(page, mobile);
    await expect(panel).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Filtreler' })).toHaveCount(mobile ? 1 : 0);
    await panel.getByLabel('En fazla fiyat seviyesi').selectOption('2');
    await panel.getByLabel('Denize sıfır').check();
    await expect(panel.getByRole('button', { name: 'Sonuçları göster (3)' })).toBeVisible();
    await panel.getByRole('button', { name: 'Sonuçları göster (3)' }).click();
    await expect(page).toHaveURL(/fiyat=2/);
    await expect(page).toHaveURL(/ozellik=beachfront%3Atrue/);
    await expect(page.getByTestId('search-hit')).toHaveCount(3);
    expect(await seriousViolations(page)).toEqual([]);
  });

  test('[REQ-ARA-013] [REQ-ARA-005] sıfır sonuçta gevşetme önerisi; yazım hatasında öneri', async ({
    page,
  }) => {
    await page.goto(`${web}/ara?q=${encodeURIComponent('trabzon kahvaltı')}`);
    const zero = page.getByTestId('zero-results');
    await expect(zero).toContainText('Bu aramayla eşleşen sonuç yok');
    await zero.getByRole('link', { name: '“Trabzon” olmadan (8 sonuç)' }).click();
    await expect(page.getByTestId('search-hit')).toHaveCount(8);

    await page.goto(`${web}/ara?q=kapadoyka+balon`);
    await expect(page.getByTestId('did-you-mean')).toContainText('kapadokya balon');
    await expect(page.getByRole('link', { name: 'Örnek Göreme Balon Turu (Demo)' })).toBeVisible();
  });
});
