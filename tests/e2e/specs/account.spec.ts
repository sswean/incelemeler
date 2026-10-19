import { readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import { E2E_STAFF_PASSWORD, WEB_PORT } from '../env.js';
import { expect, test } from '../support/fixtures.js';
import { waitForMail } from '../support/mailpit.js';

const web = `http://localhost:${WEB_PORT}`;
const LISTING: Record<string, { slug: string; name: string }> = {
  'mobile-390': {
    slug: 'ornek-kadikoy-kahve-duragi-demo',
    name: 'Örnek Kadıköy Kahve Durağı (Demo)',
  },
  'desktop-1280': {
    slug: 'ornek-baklava-atolyesi-karakoy-demo',
    name: 'Örnek Baklava Atölyesi Karaköy (Demo)',
  },
};

async function login(page: Page, email: string) {
  await page.getByLabel('E-posta').fill(email);
  await page.getByLabel('Parola').fill(E2E_STAFF_PASSWORD);
  await page.getByRole('button', { name: 'Giriş yap' }).click();
}

const link = (text: string, path: string) => {
  const m = new RegExp(`${path}\\?belirtec=[^\\s]+`).exec(text);
  if (!m) throw new Error(`${path} bağlantısı yok`);
  return m[0];
};

test.describe('Faz 1 · hesap ve KVKK akışları', () => {
  test('[REQ-HSP-012] [REQ-HSP-011] [REQ-KVK-020] kaydet → kaydedilenler → verilerimi indir → hesabımı sil (≤ 3 adım) → giriş kapalı', async ({
    page,
  }, info) => {
    const p = info.project.name;
    const { slug, name } = LISTING[p]!;
    const email = `e2e-hesap-${p}@example.test`;

    // Girişsiz kaydet → giriş → sayfaya dönüş → kaydet.
    await page.goto(`${web}/mekan/${slug}`);
    await page.getByTestId('favorite-button').click();
    await expect(page).toHaveURL(/\/giris\?sonra=/);
    await login(page, email);
    await expect(page).toHaveURL(`${web}/mekan/${slug}`);
    const fav = page.getByTestId('favorite-button');
    await expect(fav).toHaveText('Kaydet');
    await fav.click();
    await expect(fav).toHaveText('Kaydedildi');
    await expect(fav).toHaveAttribute('aria-pressed', 'true');

    await page.goto(`${web}/hesabim`);
    await page.getByRole('link', { name: 'Kaydedilenler' }).click();
    await expect(page.getByTestId('saved-list')).toContainText(name);

    // Verilerimi indir: makine tarafından okunabilir JSON, gizli alan yok.
    await page.goto(`${web}/hesabim`);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Verilerimi indir (JSON)' }).click();
    const download = await downloadPromise;
    const exported = JSON.parse(await readFile((await download.path())!, 'utf8')) as {
      format: string;
      profile: { email: string };
      favorites: Array<{ name: string }>;
    };
    expect(exported.format).toBe('incelemeler-account-export/1');
    expect(exported.profile.email).toBe(email);
    expect(exported.favorites.map((f) => f.name)).toEqual([name]);
    expect(JSON.stringify(exported)).not.toMatch(/argon2|password|token/i);

    // Hesabım → Hesabımı sil → onay (3 adım); silinen/saklanan veriler gösterilir.
    await page.getByRole('link', { name: 'Hesabımı sil' }).click();
    await expect(page.getByRole('heading', { name: 'Silinecekler' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Saklananlar' })).toBeVisible();
    const form = page.getByRole('form', { name: 'Hesabını sil' });
    await expect(form.getByLabel(/silinmesini istiyorum/)).not.toBeChecked();
    await form.getByLabel('Parolan').fill(E2E_STAFF_PASSWORD);
    await form.getByLabel(/silinmesini istiyorum/).check();
    await form.getByRole('button', { name: 'Hesabımı sil' }).click();
    await expect(page.getByRole('heading', { name: 'Hesabın silinmek üzere' })).toBeVisible();

    // Giriş kapalı; iptal bağlantısı e-postada.
    await page.goto(`${web}/giris`);
    await login(page, email);
    await expect(page.getByRole('main').getByRole('alert')).toContainText('Hesabın silme bekliyor');
    const mail = await waitForMail(email, 'silinmek üzere');
    await page.goto(link(mail, `${web}/hesap-silme/iptal`));
    await page.getByRole('button', { name: 'Silmeyi iptal et' }).click();
    await expect(page.getByText('Silme talebin iptal edildi')).toBeVisible();
  });

  test('[REQ-KVK-020] herkese açık /hesap-silme: girişsiz talep, e-posta onayı, hesabın varlığı sızmaz', async ({
    page,
  }, info) => {
    const email = `e2e-silme-${info.project.name}@example.test`;
    await page.goto(`${web}/hesap-silme`);
    const form = page.getByRole('form', { name: 'Hesap silme' });
    await form.getByLabel('E-posta').fill(`olmayan-${info.project.name}@example.test`);
    await form.getByRole('button', { name: 'Onay bağlantısı gönder' }).click();
    const sent = page.getByText('Bu adrese kayıtlı bir hesap varsa onay bağlantısı gönderdik.');
    await expect(sent).toBeVisible();

    await page.goto(`${web}/hesap-silme`);
    await form.getByLabel('E-posta').fill(email);
    await form.getByRole('button', { name: 'Onay bağlantısı gönder' }).click();
    await expect(sent).toBeVisible();
    const mail = await waitForMail(email, 'Hesap silme talebini onayla');
    await page.goto(link(mail, `${web}/hesap-silme/onay`));
    await page.getByRole('button', { name: 'Silme talebini onayla' }).click();
    await expect(page.getByRole('heading', { name: 'Hesabın silinmek üzere' })).toBeVisible();
    await page.goto(`${web}/giris`);
    await login(page, email);
    await expect(page.getByRole('main').getByRole('alert')).toContainText('Hesabın silme bekliyor');
  });
});
