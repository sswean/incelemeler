import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { WEB_PORT } from '../env.js';
import { admin, loginWithMfaSetup } from '../support/admin.js';
import { expect, test } from '../support/fixtures.js';
import { waitForMail } from '../support/mailpit.js';

const web = `http://localhost:${WEB_PORT}`;

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => v.id);
}

async function verifyFromMail(page: Page, email: string, subject: string) {
  const mail = await waitForMail(email, subject);
  const link = /http:\/\/localhost:\d+\/[a-z-]+\/dogrula\?belirtec=\S+/.exec(mail)![0];
  await page.goto(link);
  await page.getByRole('button', { name: 'Başvurumu doğrula' }).click();
  await expect(
    page.getByText(/E-posta adresin doğrulandı; başvurun inceleme kuyruğunda/),
  ).toBeVisible();
}

test.describe('Faz 1 · hesapsız başvurular', () => {
  test('[E2E-007] [REQ-ISL-001] işletme başvurusu → e-posta doğrulama → panel kuyruğu → onay listeleme taslağı oluşturur', async ({
    page,
    browser,
  }, info) => {
    const p = info.project.name;
    const email = `isletme-${p}@lokanta.example`;
    const name = `E2E Başvuru Lokantası ${p}`;

    await page.goto(web);
    await page.getByRole('contentinfo').getByRole('link', { name: 'İşletmeni ekle' }).click();
    await expect(page).toHaveURL(`${web}/isletmeni-ekle`);
    await expect(page.getByRole('heading', { level: 1, name: 'İşletmeni ekle' })).toBeVisible();
    const form = page.getByRole('form', { name: 'İşletmeni ekle' });
    await form.getByLabel('İşletme adı').fill(name);
    await form.getByLabel('İşletme türü').selectOption({ label: 'Mekan (restoran, kafe, bar…)' });
    await form.getByLabel('Kategori').selectOption({ label: 'Restoranlar' });
    await form.getByLabel('İl', { exact: true }).selectOption({ label: 'İstanbul' });
    await form.getByLabel('Adres', { exact: true }).fill('Caferağa Mah. Moda Cad. No: 7');
    await form.getByLabel('Adın soyadın').fill('Ayşe Yılmaz');
    await form.getByLabel('Görevin').fill('İşletme sahibi');
    await form.getByLabel('Kurumsal e-posta adresin').fill(email);
    // Onay kutuları işaretsiz başlar.
    await expect(form.getByLabel(/Aydınlatma metnini okudum/)).not.toBeChecked();
    await expect(form.getByLabel(/beyan ederim/)).not.toBeChecked();
    expect(await seriousViolations(page)).toEqual([]);
    await form.getByLabel(/Aydınlatma metnini okudum/).check();
    await form.getByLabel(/beyan ederim/).check();
    await form.getByRole('button', { name: 'Başvuruyu gönder' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Başvurunu aldık' })).toBeVisible();

    await verifyFromMail(page, email, 'İşletme başvurunu doğrula');

    const ctx = await browser.newContext({
      extraHTTPHeaders: { 'X-Forwarded-For': `10.248.${p === 'mobile-390' ? 1 : 2}.3` },
    });
    const staff = await ctx.newPage();
    await loginWithMfaSetup(staff, `e2e-basvuru-${p}@example.test`);
    await staff.getByRole('link', { name: 'Başvurular' }).click();
    const item = staff.getByTestId('application').filter({ hasText: name });
    await expect(item).toContainText('Restoranlar');
    await expect(item).toContainText('İstanbul');
    await expect(item.getByTestId('free-email')).toHaveCount(0);
    expect(await seriousViolations(staff)).toEqual([]);
    await item
      .getByRole('form', { name: `Onayla: ${name}` })
      .getByRole('button', { name: 'Onayla' })
      .click();
    await expect(staff.getByText('Karar kaydedildi.')).toBeVisible();
    await staff.getByLabel('Durum').selectOption({ label: 'Onaylandı' });
    await staff.getByRole('button', { name: 'Süz' }).click();
    const done = staff.getByTestId('application').filter({ hasText: name });
    await done.getByRole('link', { name: 'Listeleme taslağını aç' }).click();
    await expect(staff.getByRole('heading', { level: 1 })).toContainText(name);
    await expect(staff.getByText('Taslak').first()).toBeVisible();
    await ctx.close();

    const approved = await waitForMail(email, 'İşletme başvurun onaylandı');
    expect(approved).toContain(name);
  });

  test('[REQ-ISL-002] reklam başvurusu: ticari ileti izni ayrı ve işaretsiz; hatada girilenler korunur; satış kuyruğunda ret', async ({
    page,
    browser,
  }, info) => {
    const p = info.project.name;
    const email = `reklam-${p}@ajans.example`;
    await page.goto(web);
    await page.getByRole('contentinfo').getByRole('link', { name: 'Reklam ve sponsorluk' }).click();
    const form = page.getByRole('form', { name: 'Reklam ve sponsorluk' });
    await expect(page.getByText(/"Sponsorlu" olarak etiketlenir/)).toBeVisible();
    await form.getByLabel('Kuruluş adı').fill(`E2E Ajans ${p}`);
    await form.getByLabel('Adın soyadın').fill('Mehmet Kaya');
    await form.getByLabel('Kurumsal e-posta adresin').fill(email);
    await form
      .getByLabel('Mesajın')
      .fill('İstanbul restoranları için sponsorlu yerleşim almak istiyoruz.');
    await form.getByLabel(/Aydınlatma metnini okudum/).check();
    await expect(form.getByLabel(/ticari elektronik ileti/)).not.toBeChecked();
    // Ürün seçmeden gönderim: sunucu reddeder, girilen değerler korunur.
    await form.getByRole('button', { name: 'Başvuruyu gönder' }).click();
    await expect(form.getByText('Bu alanı doldur.')).toBeVisible();
    await expect(form.getByLabel('Kuruluş adı')).toHaveValue(`E2E Ajans ${p}`);
    await expect(form.getByLabel('Mesajın')).toHaveValue(/sponsorlu yerleşim/);
    await form.getByLabel('Sponsorlu yerleşim').check();
    await form.getByLabel(/Aydınlatma metnini okudum/).check();
    await form.getByRole('button', { name: 'Başvuruyu gönder' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Başvurunu aldık' })).toBeVisible();

    await verifyFromMail(page, email, 'Reklam ve sponsorluk başvurunu doğrula');

    const ctx = await browser.newContext({
      extraHTTPHeaders: { 'X-Forwarded-For': `10.247.${p === 'mobile-390' ? 1 : 2}.3` },
    });
    const staff = await ctx.newPage();
    await loginWithMfaSetup(staff, `e2e-basvuru-satis-${p}@example.test`);
    await staff.goto(`${admin}/basvurular`);
    const item = staff.getByTestId('application').filter({ hasText: `E2E Ajans ${p}` });
    await expect(item).toContainText('Sponsorlu yerleşim');
    await expect(item).toContainText('Ticari ileti izni yok');
    const reject = item.getByRole('form', { name: `Reddet: E2E Ajans ${p}` });
    await reject
      .getByLabel('Ret gerekçesi')
      .selectOption({ label: 'Talep sunduğumuz ürünlerin dışında' });
    await reject.getByRole('button', { name: 'Reddet' }).click();
    await expect(staff.getByText('Karar kaydedildi.')).toBeVisible();
    await ctx.close();
    const mail = await waitForMail(email, 'Reklam ve sponsorluk başvurun hakkında');
    expect(mail).toContain('Talep sunduğumuz ürünlerin dışında');
  });
});
