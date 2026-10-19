import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../support/fixtures.js';
import { ADMIN_PORT, E2E_STAFF_PASSWORD, staffEmail } from '../env.js';
import { totp } from '../support/totp.js';

const admin = `http://localhost:${ADMIN_PORT}`;

test.describe('Faz 1 · panel girişi ve 2FA', () => {
  test('[REQ-HSP-007] [REQ-GUV-001] [REQ-ADM-001] @smoke personel 2FA kurmadan panele giremez; kurtarma koduyla doğrulama', async ({
    page,
  }, info) => {
    const email = staffEmail(info.project.name);
    const login = async () => {
      await page.goto(`${admin}/giris`);
      await page.getByLabel('E-posta').fill(email);
      await page.getByLabel('Parola').fill(E2E_STAFF_PASSWORD);
      await page.getByRole('button', { name: 'Giriş yap' }).click();
    };

    // 1) İlk giriş: 2FA kurulumu zorunlu; panel ana sayfası erişilemez.
    await login();
    await expect(page).toHaveURL(`${admin}/iki-adim/kurulum`);
    await page.goto(admin);
    await expect(page).toHaveURL(`${admin}/iki-adim/kurulum`);
    const secret = (await page.getByTestId('mfa-secret').textContent())!.trim();
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
      [],
    );

    await page.getByLabel('Doğrulama kodu').fill('000000' === totp(secret) ? '111111' : '000000');
    await page.getByRole('button', { name: 'Doğrula ve etkinleştir' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toHaveText('Kod hatalı. Yeniden dene.');

    await page.getByLabel('Doğrulama kodu').fill(totp(secret));
    await page.getByRole('button', { name: 'Doğrula ve etkinleştir' }).click();
    const codes = page.getByTestId('recovery-codes').getByRole('listitem');
    await expect(codes).toHaveCount(10);
    const recovery = (await codes.first().textContent())!.trim();

    // 2) Panel: gerçek sistem durumu ve oturum sahibi.
    await page.getByRole('link', { name: 'Panele devam et' }).click();
    await expect(page.getByTestId('system-status')).toContainText('Çalışıyor');
    await expect(page.getByTestId('staff-identity')).toContainText('E2E Yönetici');

    // 3) Çıkış → yeniden giriş: bu kez doğrulama adımı; kurtarma kodu tek kullanımlık.
    await page.getByRole('button', { name: 'Çıkış yap' }).click();
    await expect(page).toHaveURL(`${admin}/giris`);
    await login();
    await expect(page).toHaveURL(`${admin}/iki-adim`);
    await page.getByLabel('Doğrulama kodu').fill(recovery);
    await page.getByRole('button', { name: 'Doğrula' }).click();
    await expect(page.getByTestId('system-status')).toContainText('Çalışıyor');

    await page.getByRole('button', { name: 'Çıkış yap' }).click();
    await login();
    await page.getByLabel('Doğrulama kodu').fill(recovery);
    await page.getByRole('button', { name: 'Doğrula' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toHaveText('Kod hatalı. Yeniden dene.');
  });

  test('[REQ-HSP-007] personel olmayan hesap panel oturumu açamaz', async ({ page }) => {
    await page.goto(`${admin}/giris`);
    await page.getByLabel('E-posta').fill('olmayan-personel@example.test');
    await page.getByLabel('Parola').fill('herhangi-bir-parola-1');
    await page.getByRole('button', { name: 'Giriş yap' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'E-posta ya da parola hatalı.',
    );
  });
});
