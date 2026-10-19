import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '../support/fixtures.js';
import { WEB_PORT } from '../env.js';
import { waitForMail } from '../support/mailpit.js';

const web = `http://localhost:${WEB_PORT}`;
// Yalnızca E2E: her koşuda sıfırlanan veritabanındaki kurgusal üye için (sır değildir).
const PASSWORD = ['kamu', 'uyesi', 'e2e', 'parolasi'].join('-');

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => v.id);
}

test.describe('Faz 1 · üyelik ve oturum (web)', () => {
  test('[REQ-HSP-002] [REQ-HSP-004] [REQ-HSP-014] @smoke üye ol → e-postayı doğrula → giriş yap → hesabım → çıkış', async ({
    page,
    context,
  }, info) => {
    const email = `uye-${info.project.name}-${Date.now()}@example.test`;

    await page.goto(`${web}/kayit`);
    expect(await seriousViolations(page)).toEqual([]);
    await page.getByLabel('Görünen ad').fill('Deneme Üye');
    await page.getByLabel('E-posta').fill(email);
    await page.getByLabel('Parola').fill(PASSWORD);
    await page.getByLabel('18 yaşından büyüğüm.').check();
    await page.getByLabel('Kullanım koşullarını okudum ve kabul ediyorum.').check();
    await page.getByRole('button', { name: 'Üye ol' }).click();
    await expect(page.getByRole('main').getByRole('status')).toContainText(
      'doğrulama bağlantısı gönderdik',
    );

    const mail = await waitForMail(email);
    const link = mail.match(/https?:\/\/\S+\/eposta-dogrula\?token=\S+/)?.[0];
    expect(link).toBeTruthy();
    await page.goto(link!);
    await expect(page.getByRole('main').getByRole('status')).toContainText(
      'E-posta adresin doğrulandı',
    );

    await page.goto(`${web}/giris`);
    expect(await seriousViolations(page)).toEqual([]);
    await page.getByLabel('E-posta').fill(email);
    await page.getByLabel('Parola').fill(PASSWORD);
    await page.getByRole('button', { name: 'Giriş yap' }).click();
    await expect(page).toHaveURL(`${web}/hesabim`);
    await expect(page.getByTestId('account-summary')).toContainText('Deneme Üye');
    await expect(page.getByTestId('account-summary')).not.toContainText('henüz doğrulanmadı');
    await expect(page.getByText('Bu cihaz')).toBeVisible();

    // REQ-HSP-004: oturum çerezi HttpOnly + Secure + SameSite, token istemci JS'ine açık değil.
    const cookie = (await context.cookies(web)).find((c) => c.name === '__Host-sid');
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.secure).toBe(true);
    expect(cookie?.sameSite).toBe('Lax');
    expect(await page.evaluate(() => document.cookie)).not.toContain('__Host-sid');

    await page.getByRole('button', { name: 'Çıkış yap' }).click();
    await expect(page).toHaveURL(`${web}/`);
    await page.goto(`${web}/hesabim`);
    await expect(page).toHaveURL(`${web}/giris`);
  });

  test('[REQ-HSP-008] hatalı parola genel bir hata mesajı gösterir (hesap varlığı sızdırılmaz)', async ({
    page,
  }) => {
    await page.goto(`${web}/giris`);
    await page.getByLabel('E-posta').fill('olmayan-hesap@example.test');
    await page.getByLabel('Parola').fill('yanlis-parola-12345');
    await page.getByRole('button', { name: 'Giriş yap' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'E-posta ya da parola hatalı.',
    );
  });

  test('[REQ-KVK-001] aydınlatma metni ayrı belgedir; hukuki metinler TASLAK etiketli', async ({
    page,
  }) => {
    for (const path of ['/kullanim-kosullari', '/kvkk-aydinlatma-metni']) {
      await page.goto(`${web}${path}`);
      await expect(page.getByTestId('legal-draft')).toHaveText('TASLAK');
    }
  });
});
