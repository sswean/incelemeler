import type { Page, Request } from '@playwright/test';
import { WEB_PORT } from '../env.js';
import { expect, test } from '../support/fixtures.js';

const web = `http://localhost:${WEB_PORT}`;
test.use({ preConsent: false });

/** Yerel sunucu dışındaki her istek (üçüncü taraf) kaydedilir. */
function thirdParty(page: Page): string[] {
  const seen: string[] = [];
  page.on('request', (r: Request) => {
    const host = new URL(r.url()).hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') seen.push(r.url());
  });
  return seen;
}

async function cookieNames(page: Page): Promise<string[]> {
  return (await page.context().cookies()).map((c) => c.name).sort();
}

test.describe('Faz 1 · çerez onayı (E2E-016)', () => {
  test('[REQ-KVK-011] [REQ-KVK-012] [REQ-KVK-014] ilk ziyarette yalnızca zorunlu; üç eşit düğme; reddet sonrası 3 sayfada aynı', async ({
    page,
  }) => {
    const external = thirdParty(page);
    await page.goto(`${web}/`);
    const banner = page.getByRole('region', { name: 'Çerez tercihleri' });
    await expect(banner).toBeVisible();
    // (a) Temiz profil: hiçbir çerez yok (tercih bile kaydedilmedi), üçüncü taraf istek yok.
    expect(await cookieNames(page)).toEqual([]);
    const buttons = [
      banner.getByRole('button', { name: 'Tümünü kabul et' }),
      banner.getByRole('button', { name: 'Tümünü reddet' }),
      banner.getByRole('link', { name: 'Tercihleri yönet' }),
    ];
    const boxes = await Promise.all(buttons.map((b) => b.boundingBox()));
    const classes = await Promise.all(buttons.map((b) => b.getAttribute('class')));
    expect(new Set(classes).size).toBe(1);
    expect(new Set(boxes.map((b) => Math.round(b!.height))).size).toBe(1);
    // Çerez duvarı yok: içerik bant açıkken de kullanılabilir.
    await expect(page.getByRole('link', { name: 'Ara' }).first()).toBeVisible();

    // (b) Tümünü reddet → yalnızca tercih çerezi (zorunlu); 3 sayfa gezinmede bant yok, üçüncü taraf yok.
    await buttons[1]!.click();
    await expect(banner).toHaveCount(0);
    for (const path of ['/ara', '/nasil-degerlendiriyoruz', '/kvkk-aydinlatma-metni']) {
      await page.goto(`${web}${path}`);
      await expect(page.getByTestId('consent-banner')).toHaveCount(0);
    }
    expect(await cookieNames(page)).toEqual(['cerez_tercihi']);
    const value = (await page.context().cookies()).find((c) => c.name === 'cerez_tercihi')!.value;
    expect(value).toMatch(/^1\.[0-9a-f-]{36}\.000\.\d+$/);
    expect(external).toEqual([]);
  });

  test('[REQ-KVK-010] [REQ-KVK-012] tercih merkezi: kategoriler işaretsiz; yalnızca analitik; geri almada çerezler silinir', async ({
    page,
  }) => {
    await page.goto(`${web}/`);
    await page.getByRole('link', { name: 'Tercihleri yönet' }).click();
    await expect(page).toHaveURL(`${web}/cerez-tercihleri`);
    const form = page.getByRole('form', { name: 'Çerez tercihleri' });
    await expect(form.getByLabel(/^Zorunlu/)).toBeChecked();
    await expect(form.getByLabel(/^Zorunlu/)).toBeDisabled();
    for (const name of [/^İşlevsel/, /^Analitik/, /^Pazarlama/]) {
      await expect(form.getByLabel(name)).not.toBeChecked();
    }
    // (c) Yalnızca analitik.
    await form.getByLabel(/^Analitik/).check();
    await form.getByRole('button', { name: 'Tercihlerimi kaydet' }).click();
    await expect(form.getByRole('status')).toHaveText('Tercihlerin kaydedildi.');
    const v1 = (await page.context().cookies()).find((c) => c.name === 'cerez_tercihi')!.value;
    expect(v1).toMatch(/\.010\.\d+$/);

    // (d) Analitik onayı geri alınınca zorunlu olmayan çerezler silinir; tercih merkezi footer'dan tek tıkla.
    await page.evaluate(() => {
      document.cookie = '_ornek_analitik=1; path=/';
    });
    await page.goto(`${web}/`);
    await page.getByRole('contentinfo').getByRole('link', { name: 'Çerez tercihleri' }).click();
    await expect(form.getByLabel(/^Analitik/)).toBeChecked();
    await form.getByLabel(/^Analitik/).uncheck();
    await form.getByRole('button', { name: 'Tercihlerimi kaydet' }).click();
    await expect(form.getByRole('status')).toHaveText('Tercihlerin kaydedildi.');
    expect(await cookieNames(page)).toEqual(['cerez_tercihi']);
    const v2 = (await page.context().cookies()).find((c) => c.name === 'cerez_tercihi')!.value;
    // Aynı anonim kimlik, yeni karar.
    expect(v2.split('.')[1]).toBe(v1.split('.')[1]);
    expect(v2).toMatch(/\.000\.\d+$/);
  });
});
