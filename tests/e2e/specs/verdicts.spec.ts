import { WEB_PORT } from '../env.js';
import { admin, loginWithMfaSetup } from '../support/admin.js';
import { expect, test } from '../support/fixtures.js';

const web = `http://localhost:${WEB_PORT}`;
/** Başka senaryoların dokunmadığı, proje başına ayrı demo listelemeler. */
const TARGET = {
  'mobile-390': {
    name: 'Örnek Urla Bağ Evi Restoran (Demo)',
    slug: 'ornek-urla-bag-evi-restoran-demo',
  },
  'desktop-1280': {
    name: 'Örnek Teras Restoran Galata (Demo)',
    slug: 'ornek-teras-restoran-galata-demo',
  },
} as const;

test.describe('Faz 1 · editör değerlendirmesi', () => {
  test('[REQ-VER-005] [REQ-VER-004] [REQ-ICR-007] editör sürüm kaydeder ve yayımlar; misafir puanı "Editör" etiketiyle ve deneyim beyanıyla görür', async ({
    page,
  }, info) => {
    const target = TARGET[info.project.name as keyof typeof TARGET];
    await loginWithMfaSetup(page, `e2e-degerlendirme-${info.project.name}@example.test`);
    await page.goto(`${admin}/listelemeler?q=${encodeURIComponent(target.name)}`);
    await page.getByRole('link', { name: target.name }).click();

    const form = page.getByRole('form', { name: 'Editör değerlendirmesi' });
    // Derlemede puan verilemez: API reddeder, anlaşılır hata döner.
    await form.getByLabel('Deneyim', { exact: true }).selectOption('RESEARCH_ONLY');
    await form.getByLabel(/Editör puanı/).fill('8');
    await form.getByLabel('Özet').fill('Kaynaklardan derlenmiş, puan içermemesi gereken bir özet.');
    await form.getByRole('button', { name: 'Yeni sürüm olarak kaydet' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText(
      'derlemede puan verilmez',
    );

    await form.getByLabel('Deneyim', { exact: true }).selectOption('VISITED');
    await form.getByLabel(/Deneyim ayrıntısı/).fill('Hafta içi akşam yemeği');
    await form.getByLabel('Deneyim tarihi').fill('2026-09-12');
    await form.getByLabel(/Editör puanı/).fill('8,5');
    await form.getByLabel('Ölçütler').fill('Lezzet | 9 | 2\nHizmet | 7,5 | 1');
    await form.getByLabel(/Artılar/).fill('Taze ürün');
    await form.getByLabel(/Eksiler/).fill('Hafta sonu kalabalık');
    await form
      .getByLabel('Özet')
      .fill('Taze ürün ve dikkatli servis; fiyatına göre tutarlı bir restoran.');
    await form.getByRole('button', { name: 'Yeni sürüm olarak kaydet' }).click();
    await expect(page.getByText('Değerlendirme kaydedildi (yayımlanmadı).')).toBeVisible();

    await page.getByRole('button', { name: 'Sürüm 1 yayımla' }).click();
    await expect(page.getByText('Değerlendirme yayımlandı.')).toBeVisible();

    // Taslağın görünmediği entegrasyon testinde (verdicts.int); sayfa burada ilk kez, yayından sonra açılır.
    const guest = await page.context().browser()!.newPage();
    await guest.goto(`${web}/mekan/${target.slug}`);
    const verdict = guest.getByTestId('editorial-verdict');
    await expect(verdict.getByTestId('experience-statement')).toHaveText(
      'Yerinde ziyaret edildi (Hafta içi akşam yemeği, Eylül 2026)',
    );
    await expect(verdict.getByTestId('editor-score')).toHaveText('Editör: 8,5/10');
    await expect(verdict).toContainText('Taze ürün');
    await expect(guest.getByTestId('editor-score-compact')).toHaveText('Editör: 8,5/10');
    await guest.close();
  });
});
