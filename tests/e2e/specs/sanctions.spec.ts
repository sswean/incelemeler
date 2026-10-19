import AxeBuilder from '@axe-core/playwright';
import { admin, loginWithMfaSetup } from '../support/admin.js';
import { expect, test } from '../support/fixtures.js';
import { waitForMail } from '../support/mailpit.js';

test.describe('Faz 1 · hesap yaptırımları', () => {
  test('[REQ-GUN-007] [REQ-GUN-003] moderatör gerekçeli uyarı verir → kullanıcı e-postadaki bağlantıyla itiraz eder → başka moderatör kaldırır', async ({
    page,
    browser,
  }, info) => {
    const p = info.project.name;
    const member = `e2e-yaptirim-uye-${p}@example.test`;

    await loginWithMfaSetup(page, `e2e-yaptirim-a-${p}@example.test`);
    await page.getByRole('link', { name: 'Yaptırımlar' }).click();
    const form = page.getByRole('form', { name: 'Yaptırım uygula' });
    await form.getByLabel('Kullanıcının e-posta adresi').fill(member);
    await form.getByRole('combobox', { name: /^Basamak/ }).selectOption({ label: 'Uyarı' });
    await form
      .getByRole('combobox', { name: /^Gerekçe/ })
      .selectOption({ label: 'Reklam ya da istenmeyen içerik' });
    await form
      .getByLabel('Açıklama (kullanıcıya gönderilir)')
      .fill('Değerlendirmelerinde tekrar eden reklam bağlantıları.');
    await form.getByRole('button', { name: 'Uygula' }).click();
    await expect(page.getByText(/Yaptırım uygulandı/)).toBeVisible();
    const violations = (await new AxeBuilder({ page }).analyze()).violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(violations.map((v) => v.id)).toEqual([]);

    const mail = await waitForMail(member, 'Hesabınla ilgili bir karar');
    expect(mail).toContain('Uyarı');
    const link = /http:\/\/localhost:\d+\/itiraz\/yaptirim\?belirtec=\S+/.exec(mail)![0];
    const guest = await browser.newContext();
    const g = await guest.newPage();
    await g.goto(link);
    await g
      .getByLabel('İtiraz gerekçen')
      .fill('Paylaştığım bağlantılar kendi deneyimimin kaynaklarıydı.');
    await g.getByRole('button', { name: 'İtirazı gönder' }).click();
    await expect(g.getByText('İtirazını aldık; sonucu e-postayla bildireceğiz.')).toBeVisible();
    await guest.close();

    // Yaptırımı veren moderatör itirazı karara bağlayamaz (API + CHECK); başka moderatör karar verir.
    const ctx = await browser.newContext({
      extraHTTPHeaders: { 'X-Forwarded-For': `10.246.${p === 'mobile-390' ? 1 : 2}.3` },
    });
    const b = await ctx.newPage();
    await loginWithMfaSetup(b, `e2e-yaptirim-b-${p}@example.test`);
    await b.goto(`${admin}/yaptirimlar`);
    const appeal = b.getByTestId('sanction-appeal').filter({ hasText: member });
    await expect(appeal).toContainText('kendi deneyimimin kaynaklarıydı');
    await appeal
      .getByRole('textbox', { name: 'Karar notu' })
      .fill('Bağlantılar kaynak niteliğinde; uyarı kaldırıldı.');
    await appeal.getByRole('button', { name: 'Yaptırımı kaldır' }).click();
    await expect(b.getByText('Kaydedildi.')).toBeVisible();
    await ctx.close();
    expect(await waitForMail(member, 'Yaptırım itirazın sonuçlandı')).toContain(
      'Yaptırım kaldırıldı.',
    );
    await expect(page).toHaveURL(new RegExp(`${admin}/yaptirimlar`));
  });
});
