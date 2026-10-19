import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '../support/fixtures.js';
import { admin, loginWithMfaSetup } from '../support/admin.js';
import { testPatternJpeg } from '../support/image.js';

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => v.id);
}

async function createListing(
  page: Page,
  kind: string,
  category: string,
  name: string,
  demo = false,
) {
  await page.goto(`${admin}/listelemeler/yeni`);
  await page.getByLabel('Tür').selectOption({ label: kind });
  await page.getByLabel('Kategori').selectOption({ label: category });
  await page.getByLabel('Ad', { exact: true }).fill(name);
  await page.getByLabel('Kaynak').fill('Editör ziyareti');
  if (demo) await page.getByLabel(/Kurgusal demo/).check();
  await page.getByRole('button', { name: 'Yeni listeleme' }).click();
  await expect(page.getByRole('main').getByRole('status')).toHaveText('Değişiklikler kaydedildi.');
}

test.describe('Faz 1 · listeleme yönetimi (panel)', () => {
  test('[REQ-LST-001] [REQ-VER-009] editör mekan oluşturur, eksikleri görür, tamamlar ve yayımlar', async ({
    page,
  }, info) => {
    await loginWithMfaSetup(page, `e2e-katalog-${info.project.name}@example.test`);
    const name = `Deneme Lokantası ${info.project.name}`;
    await createListing(page, 'Mekan', '— Restoranlar', name);
    const blockers = page.getByTestId('publish-blockers');
    await expect(blockers).toContainText('Konum gerekli.');
    await expect(blockers).toContainText('En az bir iletişim kanalı gerekli.');
    expect(await seriousViolations(page)).toEqual([]);

    const form = page.getByRole('form', { name: 'Listelemeler' });
    await form.getByLabel('Telefon').fill('+90 216 000 00 00');
    await form.getByLabel('İl', { exact: true }).selectOption({ label: 'İstanbul' });
    await form.getByLabel('İlçe').selectOption({ label: 'Kadıköy' });
    await form.getByLabel('Enlem').fill('40,990123');
    await form.getByLabel('Boylam').fill('29.0289');
    await form.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.getByText('Yayın için gerekli bilgiler tamam.')).toBeVisible();

    // REQ-VER-014: görsel yüklenir; lisans bilgisi tamamlanmadan yayın engellenir.
    const upload = page.getByRole('form', { name: 'Görsel yükle' });
    await upload.getByLabel('Dosya').setInputFiles({
      name: 'desen.jpg',
      mimeType: 'image/jpeg',
      buffer: testPatternJpeg(),
    });
    await upload.getByLabel('Alternatif metin').fill('Test deseni');
    await upload.getByRole('button', { name: 'Görsel yükle' }).click();
    const media = page.getByTestId('listing-media');
    await expect(media).toContainText('Kapak');
    await expect(media).toContainText('Lisans eksik');
    await expect(page.getByTestId('publish-blockers')).toContainText(
      'Lisans bilgileri eksik görsel var.',
    );
    const preview = media.getByRole('img', { name: 'Test deseni' });
    await expect(preview).toBeVisible();
    expect(await preview.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(320);

    await media.getByRole('link', { name: 'Lisans bilgileri' }).click();
    await page.getByLabel('Kaynak türü').selectOption({ label: 'Editör çekimi' });
    await page.getByLabel('Hak sahibi / atıf').fill('İncelemeler editör ekibi');
    await page.getByLabel('Lisans türü').fill('Kurum içi çekim');
    await page.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.getByTestId('listing-media')).toContainText('Lisans tamam');
    await expect(page.getByText('Yayın için gerekli bilgiler tamam.')).toBeVisible();

    await page.getByRole('button', { name: 'Yayımla' }).click();
    await expect(page.getByTestId('listing-meta')).toContainText('Durum: Yayında');

    await page.goto(`${admin}/listelemeler?durum=PUBLISHED`);
    await expect(page.getByTestId('listing-table')).toContainText(name);
    expect(await seriousViolations(page)).toEqual([]);
  });

  test('[REQ-KAT-004] konaklamada hukuki kapı: gerçek listeleme kapalı, test fikstürü yalnızca demo listelemeyi açar', async ({
    page,
  }, info) => {
    await loginWithMfaSetup(page, `e2e-katalog2-${info.project.name}@example.test`);
    await createListing(page, 'Konaklama', '— Oteller', `Gerçek Otel ${info.project.name}`);
    await expect(page.getByTestId('publish-blockers')).toContainText('hukuki onay');

    await createListing(
      page,
      'Konaklama',
      '— Oteller',
      `Örnek Otel ${info.project.name} (Demo)`,
      true,
    );
    await expect(page.getByTestId('listing-meta')).toContainText('Demo');
    await expect(page.getByTestId('publish-blockers')).not.toContainText('hukuki onay');
    await expect(page.getByTestId('publish-blockers')).toContainText(
      'Turizm belge numarası gerekli.',
    );
  });
});
