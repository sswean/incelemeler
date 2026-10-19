import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '../support/fixtures.js';
import { admin, loginWithMfaSetup } from '../support/admin.js';
import { API_PORT } from '../env.js';

const api = `http://localhost:${API_PORT}`;

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => v.id);
}

test.describe('Faz 1 · taksonomi yönetimi (panel)', () => {
  test('[REQ-KAT-001] [REQ-KAT-003] [REQ-KAT-004] yönetici kod değiştirmeden kategori ekler, hata durumunu görür ve yayımlar', async ({
    page,
    request,
  }, info) => {
    const name = `Glamping alanları ${info.project.name}`;
    const slug = `glamping-alanlari-${info.project.name}`;
    const publicSlugs = async () => {
      const res = await request.get(`${api}/v1/categories?limit=100`);
      return ((await res.json()) as { data: Array<{ slug: string }> }).data.map((c) => c.slug);
    };

    await loginWithMfaSetup(page, `e2e-taksonomi-${info.project.name}@example.test`);
    await page.getByRole('link', { name: 'Kategoriler' }).click();
    await expect(page.getByTestId('category-table')).toContainText('Konaklama');
    expect(await seriousViolations(page)).toEqual([]);

    await page.getByRole('link', { name: 'Yeni kategori' }).click();
    await page.getByLabel('Ad', { exact: true }).fill(name);
    await page.getByLabel('Üst kategori').selectOption({ label: 'Konaklama' });
    // Lisanslı üst kategoriden devralınan bayrak: sponsorluk kapalı (REQ-KAT-004).
    await expect(page.getByLabel('Sponsorluğa açık')).not.toBeChecked();
    await expect(page.getByLabel('Lisans/belge gerektirir')).toBeChecked();
    await page.getByLabel('Konaklama', { exact: true }).check();
    expect(await seriousViolations(page)).toEqual([]);
    await page.getByRole('button', { name: 'Kaydet' }).click();

    await expect(page.getByRole('main').getByRole('status')).toHaveText(
      'Değişiklikler kaydedildi.',
    );
    await expect(page.getByRole('main')).toContainText(`Durum: Taslak · /${slug}`);
    expect(await publicSlugs()).not.toContain(slug);

    // Aynı adla ikinci kategori: alan hatası gösterilir, kayıt oluşmaz.
    await page.goto(`${admin}/kategoriler/yeni`);
    await page.getByLabel('Ad', { exact: true }).fill(name);
    await page.getByLabel('Mekan').check();
    await page.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.getByText('Bu adres başka bir kategoride kullanılıyor.')).toBeVisible();

    // Yayımla → herkese açık API'de görünür.
    await page.goto(`${admin}/kategoriler`);
    await page.getByRole('link', { name, exact: true }).click();
    await page.getByLabel('Durum').selectOption({ label: 'Yayında' });
    await page.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.getByRole('main')).toContainText(`Durum: Yayında · /${slug}`);
    expect(await publicSlugs()).toContain(slug);
    // Yayımlanmış kategorinin adresi kilitlenir.
    await expect(page.getByLabel('Adres (slug)')).toHaveAttribute('readonly', '');

    // Özellik şeması (REQ-VER-003): üç tipli özellik, deploy olmadan.
    const attrForm = page.getByRole('form', { name: 'Özellik ekle' });
    const addAttribute = async (
      key: string,
      label: string,
      type: string,
      extra?: () => Promise<void>,
    ) => {
      await attrForm.getByLabel('Anahtar').fill(key);
      await attrForm.getByLabel('Etiket').fill(label);
      await attrForm.getByLabel('Tip').selectOption({ label: type });
      await extra?.();
      await attrForm.getByLabel('Filtrelenebilir').check();
      await attrForm.getByRole('button', { name: 'Özellik ekle' }).click();
      await expect(page.getByTestId('attribute-list')).toContainText(label);
    };
    await addAttribute('hasPrivateBathroom', 'Özel banyo', 'Evet/Hayır');
    await addAttribute('tentType', 'Çadır tipi', 'Tek seçim', async () => {
      await attrForm.getByLabel('Seçenekler').fill('Safari çadırı\nBalon çadır');
    });
    await addAttribute('maxGuests', 'En fazla kişi', 'Tam sayı', async () => {
      await attrForm.getByLabel('Birim').fill('kişi');
      await attrForm.getByLabel('En küçük değer').fill('1');
      await attrForm.getByLabel('En büyük değer').fill('12');
    });
    await expect(page.getByTestId('attribute-list')).toContainText('Safari çadırı, Balon çadır');
    // Aynı anahtar ikinci kez eklenemez; alan hatası gösterilir.
    await attrForm.getByLabel('Anahtar').fill('maxGuests');
    await attrForm.getByLabel('Etiket').fill('Tekrar');
    await attrForm.getByRole('button', { name: 'Özellik ekle' }).click();
    await expect(attrForm).toContainText('Bu anahtar bu kategori dalında zaten kullanılıyor.');

    // Değerlendirme kriterleri: önce Konaklama'dan devralınır, kendi kriteri eklenince devralma biter.
    await expect(
      page.getByText('Bu kategorinin kendi kriteri yok; şu kategorininkiler kullanılıyor:'),
    ).toBeVisible();
    await expect(page.getByTestId('criteria-list')).toContainText('Oda konforu');
    const critForm = page.getByRole('form', { name: 'Kriter ekle' });
    await critForm.getByLabel('Kriter adı').fill('Doğa ile uyum');
    await critForm.getByRole('button', { name: 'Kriter ekle' }).click();
    await expect(page.getByTestId('criteria-list')).toHaveText(/Doğa ile uyum/);
    await expect(page.getByTestId('criteria-list')).not.toContainText('Oda konforu');
    expect(await seriousViolations(page)).toEqual([]);
  });
});
