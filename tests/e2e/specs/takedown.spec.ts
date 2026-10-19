import AxeBuilder from '@axe-core/playwright';
import { WEB_PORT } from '../env.js';
import { loginWithMfaSetup } from '../support/admin.js';
import { expect, test } from '../support/fixtures.js';
import { waitForMail } from '../support/mailpit.js';

const web = `http://localhost:${WEB_PORT}`;

test.describe('Faz 1 · hukuki talepler', () => {
  test('[REQ-GUN-005] hukuki talep formu → alındı e-postası ve süre → panelde gerekçeli sonuç → talep edene bildirim', async ({
    page,
    browser,
  }, info) => {
    const p = info.project.name;
    const email = `hukuk-${p}@buro.example`;
    await page.goto(web);
    await page
      .getByRole('contentinfo')
      .getByRole('link', { name: 'Hukuki talep bildirimi' })
      .click();
    await expect(page).toHaveURL(`${web}/hukuki-talep`);
    const form = page.getByRole('form', { name: 'Hukuki talep ve içerik kaldırma bildirimi' });
    // Resmî kararlar formda seçilemez (ayrı akış).
    await expect(form.getByLabel('Talep türü').locator('option')).toHaveText([
      'Telif hakkı ihlali',
      'Kişilik hakkı ihlali',
      'Diğer hukuki talep',
    ]);
    await form.getByLabel('Talep türü').selectOption({ label: 'Telif hakkı ihlali' });
    await form.getByLabel('Adın soyadın').fill(`Av. Deniz Ak ${p}`);
    await form.getByLabel('E-posta adresin').fill(email);
    await form
      .getByLabel('Sıfatın')
      .selectOption({ label: 'Hak sahibinin temsilcisiyim (avukat vb.)' });
    await form.getByLabel('İçeriğin adresi (URL)').fill(`${web}/mekan/ornek-moda-ocakbasi-demo`);
    await form
      .getByLabel('Talebin ve dayanağı')
      .fill('Müvekkilin çektiği fotoğraf izinsiz kullanılmıştır; kaldırılmasını talep ederiz.');
    await expect(form.getByLabel(/iyi niyetle/)).not.toBeChecked();
    expect(
      (await new AxeBuilder({ page }).analyze()).violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => v.id),
    ).toEqual([]);
    await form.getByLabel(/iyi niyetle/).check();
    await form.getByRole('button', { name: 'Talebi gönder' }).click();
    const ack = page.getByRole('status').filter({ hasText: 'Talebini aldık' });
    await expect(ack).toContainText(/HT-[0-9A-F]{8}/);
    const reference = /HT-[0-9A-F]{8}/.exec((await ack.textContent())!)![0];
    expect(await waitForMail(email, reference)).toContain('tarihine kadar');

    const ctx = await browser.newContext({
      extraHTTPHeaders: { 'X-Forwarded-For': `10.245.${p === 'mobile-390' ? 1 : 2}.3` },
    });
    const staff = await ctx.newPage();
    await loginWithMfaSetup(staff, `e2e-hukuk-${p}@example.test`);
    await staff.getByRole('link', { name: 'Hukuki talepler' }).click();
    const item = staff.getByTestId('takedown').filter({ hasText: email });
    await expect(item).toContainText('Telif hakkı ihlali · Alındı');
    const f = item.getByRole('form');
    await f.getByRole('combobox', { name: 'Durum' }).selectOption({ label: 'Reddedildi' });
    await f
      .getByRole('combobox', { name: 'Ret gerekçesi' })
      .selectOption({ label: 'İçerik platformumuzda değil' });
    await f.getByRole('button', { name: 'Kaydet' }).click();
    await expect(staff.getByText('Talep güncellendi.')).toBeVisible();
    await expect(staff.getByTestId('takedown').filter({ hasText: email })).toHaveCount(0);
    await ctx.close();
    expect(await waitForMail(email, `sonuçlandı (${reference})`)).toContain(
      'İçerik platformumuzda değil',
    );
  });
});
