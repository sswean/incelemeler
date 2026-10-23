import type { Page } from '@playwright/test';
import { WEB_PORT } from '../env.js';
import { admin, loginWithMfaSetup } from '../support/admin.js';
import { expect, test } from '../support/fixtures.js';

const web = `http://localhost:${WEB_PORT}`;
/** Başka senaryoların dokunmadığı, proje başına ayrı demo listelemeler (paralel koşular birbirini etkilemez). */
const TARGET = {
  'mobile-390': {
    name: 'Örnek Karşıyaka Balık Evi (Demo)',
    slug: 'ornek-karsiyaka-balik-evi-demo',
  },
  'desktop-1280': {
    name: 'Örnek Gümüşlük Balıkçı Restoran (Demo)',
    slug: 'ornek-gumusluk-balikci-restoran-demo',
  },
} as const;
const WITHOUT_HOURS = 'Örnek Balıkçı Lokantası Kumkapı (Demo)';
const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

/** Mobilde filtre paneli alt sayfa olarak rozetli düğmeyle açılır; masaüstünde yan sütundadır. */
async function openFilters(page: Page, mobile: boolean) {
  if (mobile) await page.getByRole('button', { name: 'Filtreler (1)' }).click();
}

async function setAlwaysOpen(page: Page, name: string, closedDate: string) {
  await page.goto(`${admin}/listelemeler?q=${encodeURIComponent(name)}`);
  await page.getByRole('link', { name }).click();
  const form = page.getByRole('form', { name: 'Çalışma saatleri' });
  for (const day of DAYS) {
    await form.getByLabel(`${day} Aralık 1 Açılış`).fill('00:00');
    await form.getByLabel(`${day} Aralık 1 Kapanış`).fill('24:00');
  }
  await form.getByLabel('Özel günler').fill(`${closedDate} kapalı Bakım günü`);
  await form.getByLabel('Saatleri kaynağından doğruladım').check();
  await form.getByRole('button', { name: 'Saatleri kaydet' }).click();
  await expect(page.getByText('Çalışma saatleri kaydedildi.')).toBeVisible();
  await expect(page.getByTestId('hours-verified')).not.toContainText('Doğrulanmadı');
  // Biçimsiz saati tarayıcı (pattern), açılışı kapanışa eşit aralığı API reddeder; kayıt bozulmaz.
  await form.getByLabel('Pazartesi Aralık 2 Açılış').fill('09:00');
  await form.getByLabel('Pazartesi Aralık 2 Kapanış').fill('09:00');
  await form.getByRole('button', { name: 'Saatleri kaydet' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Çalışma saatlerini kontrol et.',
  );
  await expect(form.getByLabel('Pazartesi Aralık 2 Açılış')).toHaveValue('');
}

test.describe('Faz 1 · çalışma saatleri ve "Şu an açık"', () => {
  test('[E2E-002] [REQ-VER-010] [REQ-ARA-012] editör saat girer; misafir "Şu an açık" filtresiyle bulur, detayda durum ve özel gün görünür, geri döner', async ({
    page,
  }, info) => {
    const project = info.project.name as keyof typeof TARGET;
    const target = TARGET[project];
    const closedDate = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);
    await loginWithMfaSetup(page, `e2e-saatler-${project}@example.test`);
    await setAlwaysOpen(page, target.name, closedDate);

    await page.goto(`${web}/ara?kategori=restoranlar`);
    await expect(page.getByRole('link', { name: WITHOUT_HOURS })).toBeVisible();
    await openFilters(page, project === 'mobile-390');
    const panel = page.locator('#filtre-paneli');
    await panel.getByLabel('Şu an açık').check();
    await panel.getByRole('button', { name: /Sonuçları göster/ }).click();
    await expect(page).toHaveURL(/acik=1/);
    const chips = page.getByRole('list', { name: 'Filtreler' });
    await expect(chips.getByRole('link', { name: 'Şu an açık filtresini kaldır' })).toBeVisible();
    await expect(page.getByRole('link', { name: target.name })).toBeVisible();
    // Saati bilinmeyen listeleme "açık" sayılmaz.
    await expect(page.getByRole('link', { name: WITHOUT_HOURS })).toHaveCount(0);

    await page.getByRole('link', { name: target.name }).click();
    await expect(page).toHaveURL(`${web}/mekan/${target.slug}`);
    const hours = page.getByTestId('opening-hours');
    await expect(hours.getByTestId('open-status')).toHaveText('Şu an açık');
    await expect(hours).toContainText('00:00–24:00');
    await expect(hours).toContainText('Bakım günü');
    await page.goBack();
    await expect(page).toHaveURL(/acik=1/);
    await expect(page.getByRole('link', { name: target.name })).toBeVisible();
  });
});
