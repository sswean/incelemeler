import { WEB_PORT } from '../env.js';
import { expect, test } from '../support/fixtures.js';
import { admin, loginWithMfaSetup } from '../support/admin.js';
import { waitForMail } from '../support/mailpit.js';

const web = `http://localhost:${WEB_PORT}`;

test.describe('Faz 1 · KVKK başvurusu', () => {
  test('[REQ-KVK-022] girişsiz başvuru → e-postayla doğrulama → panelde süre sayacı ve yanıt', async ({
    page,
    browser,
  }, info) => {
    const p = info.project.name;
    const email = `kvkk-basvuran-${p}@example.test`;
    await page.goto(`${web}/`);
    await page.getByRole('contentinfo').getByRole('link', { name: 'KVKK başvurusu' }).click();
    const form = page.getByRole('form', { name: 'KVKK başvurusu' });
    await form
      .getByLabel('Başvuru türü')
      .selectOption({ label: 'Verilerime erişmek / kopyasını almak' });
    await form.getByLabel('E-posta').fill(email);
    await form
      .getByLabel('Başvurunu açıkla')
      .fill('Hakkımda tuttuğunuz verilerin bir kopyasını istiyorum.');
    // Kimlik numarası gibi gereksiz alan yok.
    await expect(form.getByRole('textbox')).toHaveCount(2);
    await form.getByRole('button', { name: 'Başvuruyu gönder' }).click();
    await expect(
      page.getByText(/e-postana gönderdiğimiz bağlantıyı 72 saat içinde aç/),
    ).toBeVisible();

    const mail = await waitForMail(email, 'KVKK başvurunu doğrula');
    const link = /http:\/\/localhost:\d+\/kvkk-basvuru\/dogrula\?belirtec=\S+/.exec(mail)![0];
    await page.goto(link);
    await page.getByRole('button', { name: 'Başvurumu doğrula' }).click();
    await expect(page.getByText('Başvurun doğrulandı.')).toBeVisible();

    const ctx = await browser.newContext({
      extraHTTPHeaders: { 'X-Forwarded-For': `10.249.${p === 'mobile-390' ? 1 : 2}.3` },
    });
    const staff = await ctx.newPage();
    await loginWithMfaSetup(staff, `e2e-kvkk-${p}@example.test`);
    await staff.goto(`${admin}/kvkk-basvurulari`);
    const item = staff.getByTestId('data-request').filter({ hasText: email });
    await expect(item).toContainText('Kimlik doğrulandı');
    await expect(item).toContainText('0. gün');
    const update = item.getByRole('form');
    await update.getByLabel('Durum').selectOption({ label: 'Yanıtlandı' });
    await update.getByLabel('Yanıt notu').fill('Veri kopyası e-postayla iletildi.');
    await update.getByRole('button', { name: 'Kaydet' }).click();
    await expect(staff.getByText('Başvuru güncellendi.')).toBeVisible();
    await expect(
      staff
        .getByTestId('data-request')
        .filter({ hasText: email })
        .getByRole('combobox', { name: 'Durum' }),
    ).toHaveValue('ANSWERED');
    await ctx.close();
  });
});
