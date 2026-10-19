import { expect, test } from '../support/fixtures.js';
import { admin, loginWithMfaSetup } from '../support/admin.js';

test.describe('Faz 1 · toplu içe aktarma (panel)', () => {
  test('[REQ-LST-007] CSV önizleme → hatalı/yinelenen satır raporu → içe aktarma → geri alma', async ({
    page,
  }, info) => {
    const p = info.project.name;
    await loginWithMfaSetup(page, `e2e-aktarim-${p}@example.test`);
    await page.getByRole('link', { name: 'İçe aktarma' }).click();
    await expect(page).toHaveURL(`${admin}/ice-aktarma`);

    const csv = [
      'Ad;İl;İlçe;Enlem;Boylam;Telefon;Notlar',
      `Aktarım Lokantası ${p};İstanbul;Beşiktaş;41,0430;29,0090;+90 212 000 00 00;x`,
      ';İstanbul;;;;;',
      `AKTARIM LOKANTASI ${p};İstanbul;Beşiktaş;41,04305;29,0090;;`,
    ].join('\n');
    const form = page.getByRole('form', { name: 'Toplu içe aktarma' });
    await form.getByLabel('Tür').selectOption({ label: 'Mekan' });
    await form.getByLabel('Kategori').selectOption({ label: '— Restoranlar' });
    await form.getByLabel('Kaynak').fill('E2E test verisi (kurgusal)');
    await form.getByLabel('CSV dosyası').setInputFiles({
      name: 'mekanlar.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv, 'utf8'),
    });
    await form.getByRole('button', { name: 'Önizle' }).click();

    await expect(page.getByTestId('import-summary')).toContainText('3 satır · 1 geçerli');
    const rows = page.getByTestId('import-rows');
    await expect(rows).toContainText('Ad gerekli');
    await expect(rows).toContainText('Şu satırla aynı: 2 (aynı ad, 150 m içinde)');
    await expect(page.getByText('Eşlenmeyen sütunlar (içe aktarılmaz): Notlar')).toBeVisible();

    await page.getByRole('button', { name: 'Geçerli satırları içe aktar' }).click();
    await expect(page.getByTestId('import-summary')).toContainText('1 oluşturuldu');
    await expect(rows.getByRole('link', { name: `Aktarım Lokantası ${p}` })).toBeVisible();

    await page.getByRole('button', { name: 'İşlemi geri al' }).click();
    await expect(page.getByTestId('import-summary')).toContainText('Geri alındı');
  });
});
