import { expect, type Page } from '@playwright/test';
import { ADMIN_PORT, E2E_STAFF_PASSWORD } from '../env.js';
import { totp } from './totp.js';

export const admin = `http://localhost:${ADMIN_PORT}`;

/** İlk kez giriş yapan personel: giriş + zorunlu 2FA kurulumu; panel ana sayfasında biter. */
export async function loginWithMfaSetup(page: Page, email: string): Promise<void> {
  await page.goto(`${admin}/giris`);
  await page.getByLabel('E-posta').fill(email);
  await page.getByLabel('Parola').fill(E2E_STAFF_PASSWORD);
  await page.getByRole('button', { name: 'Giriş yap' }).click();
  await expect(page).toHaveURL(`${admin}/iki-adim/kurulum`);
  const secret = (await page.getByTestId('mfa-secret').textContent())!.trim();
  await page.getByLabel('Doğrulama kodu').fill(totp(secret));
  await page.getByRole('button', { name: 'Doğrula ve etkinleştir' }).click();
  await expect(page.getByTestId('recovery-codes').getByRole('listitem')).toHaveCount(10);
  await page.getByRole('link', { name: 'Panele devam et' }).click();
  await expect(page.getByTestId('system-status')).toBeVisible();
}
