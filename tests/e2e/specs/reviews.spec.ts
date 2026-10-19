import AxeBuilder from '@axe-core/playwright';
import type { Browser, Page } from '@playwright/test';
import { E2E_STAFF_PASSWORD, WEB_PORT } from '../env.js';
import { expect, test, withConsent } from '../support/fixtures.js';
import { admin, loginWithMfaSetup } from '../support/admin.js';

const web = `http://localhost:${WEB_PORT}`;
// Her proje kendi demo listelemesinde çalışır (paralel koşular birbirini etkilemesin).
const LISTING: Record<string, { slug: string; name: string }> = {
  'mobile-390': { slug: 'ornek-moda-ocakbasi-demo', name: 'Örnek Moda Ocakbaşı (Demo)' },
  'desktop-1280': { slug: 'ornek-uskudar-borekcisi-demo', name: 'Örnek Üsküdar Börekçisi (Demo)' },
};
const BODY =
  'Su böreği tazeydi, çay demliydi; hafta sonu sabahı kalabalıktı ama sıra hızlı ilerledi ve masalar temizdi.';

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => v.id);
}

async function moderatorPage(browser: Browser, project: string, ip: string) {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-For': ip } });
  const page = await ctx.newPage();
  await loginWithMfaSetup(page, `e2e-moderator-${project}@example.test`);
  return { ctx, page };
}

async function decide(page: Page, listingName: string, action: string, reason?: string) {
  await page.goto(`${admin}/moderasyon?kuyruk=pending`);
  const form = page.getByRole('form', { name: `${action}: ${listingName}` });
  if (reason) await form.getByLabel('Gerekçe kodu').selectOption({ label: reason });
  await form.getByLabel('Not (kullanıcıya gösterilir)').fill('E2E moderasyon notu');
  await form.getByRole('button', { name: action }).click();
  await expect(page.getByRole('main').getByRole('status')).toHaveText('Karar kaydedildi.');
}

test.describe('Faz 1 · kullanıcı değerlendirmeleri ve moderasyon', () => {
  test('[REQ-DEG-004] [REQ-DEG-001] [REQ-GUN-001] misafir taslağı → giriş → gönderim → ret → yeniden gönderim → onay → yayında', async ({
    page,
    browser,
  }, info) => {
    const p = info.project.name;
    const { slug, name } = LISTING[p]!;

    // Misafir yazmaya başlar (A6.4): taslak cihazda tutulur.
    await page.goto(`${web}/mekan/${slug}`);
    await page.getByRole('link', { name: 'Değerlendirme yaz' }).first().click();
    await expect(page).toHaveURL(/\/degerlendir\/[0-9a-f-]+$/);
    const reviewUrl = page.url();
    const form = page.getByRole('form', { name: `${name} için değerlendirme` });
    await form.getByLabel(/İyi$/).check();
    await form.getByLabel('Ne zaman? (ay/yıl)').fill('2026-09');
    await form.getByLabel('Deneyimin').fill(BODY);
    await form.getByLabel('Bu deneyim bana ait ve gerçek.').check();
    await form.getByLabel(/rakip ilişkim yok/).check();
    await form.getByRole('radio', { name: 'Hayır' }).check();
    expect(await seriousViolations(page)).toEqual([]);
    await form.getByRole('button', { name: 'Göndermek için giriş yap' }).click();

    // Gönder'de giriş istenir; girişten sonra taslak eksiksiz geri yüklenir.
    await expect(page).toHaveURL(/\/giris\?sonra=/);
    await page.getByLabel('E-posta').fill(`e2e-uye-${p}@example.test`);
    await page.getByLabel('Parola').fill(E2E_STAFF_PASSWORD);
    await page.getByRole('button', { name: 'Giriş yap' }).click();
    await expect(page).toHaveURL(reviewUrl);
    await expect(page.getByText('Taslağın geri yüklendi.')).toBeVisible();
    await expect(form.getByLabel('Deneyimin')).toHaveValue(BODY);
    await expect(form.getByLabel(/İyi$/)).toBeChecked();
    await form.getByRole('button', { name: 'Gönder', exact: true }).click();
    await expect(page).toHaveURL(/\/hesabim\/degerlendirmelerim\?durum=gonderildi/);
    const status = page.getByTestId('my-review-status');
    await expect(status).toHaveText('İncelemede');

    // Moderatör reddeder (gerekçe kodu zorunlu) → üye gerekçeyi görür, düzenleyip yeniden gönderir.
    const mod = await moderatorPage(browser, p, `10.251.${p === 'mobile-390' ? 1 : 2}.9`);
    await decide(mod.page, name, 'Reddet', 'Kişisel veri içeriyor');
    await page.reload();
    await expect(status).toHaveText('Yayımlanmadı');
    await expect(page.getByTestId('my-review-reason')).toContainText('Kişisel veri içeriyor');
    await page.getByRole('link', { name: 'Düzenle ve yeniden gönder' }).click();
    await expect(form.getByLabel('Deneyimin')).toHaveValue(BODY);
    await form.getByLabel('Deneyimin').fill(`${BODY} Fiyatlar da makuldü.`);
    // Beyanlar her gönderimde yeniden verilir (önceden işaretli kutu yok — A6.4).
    await expect(form.getByLabel('Bu deneyim bana ait ve gerçek.')).not.toBeChecked();
    await form.getByLabel('Bu deneyim bana ait ve gerçek.').check();
    await form.getByLabel(/rakip ilişkim yok/).check();
    await form.getByRole('button', { name: 'Gönder', exact: true }).click();
    await expect(status).toHaveText('İncelemede');

    await decide(mod.page, name, 'Onayla');
    await page.reload();
    await expect(status).toHaveText('Yayında');

    // Herkese açık liste: n = 1 → ortalama gösterilmez (A6.2); istatistik outbox ile güncellenir.
    const listUrl = reviewUrl.replace('/degerlendir/', '/degerlendirmeler/');
    await expect(async () => {
      await page.goto(listUrl);
      await expect(page.getByTestId('rating-summary')).toHaveText(
        '1 değerlendirme · Ortalama için en az 3 değerlendirme gerekiyor',
        { timeout: 1000 },
      );
    }).toPass();
    await expect(page.getByTestId('review')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);

    // Misafir bildirir (REQ-GUN-002); bildirim moderatörün kuyruğuna düşer, içerik yayında kalır.
    const guest = await browser.newContext({
      extraHTTPHeaders: { 'X-Forwarded-For': `10.253.${p === 'mobile-390' ? 1 : 2}.9` },
    });
    await withConsent(guest);
    const gp = await guest.newPage();
    await gp.goto(listUrl);
    const review = gp.getByTestId('review').first();
    await review.getByText('Bildir', { exact: true }).click();
    const report = review.getByRole('form', { name: 'Değerlendirmeyi bildir' });
    await report.getByLabel('Neden').selectOption({ label: 'Reklam ya da spam' });
    await report.getByRole('button', { name: 'Bildirimi gönder' }).click();
    await expect(review.getByRole('status')).toHaveText(
      'Bildirimin alındı. Karar verilene kadar içerik yayında kalır.',
    );
    await guest.close();
    await mod.page.goto(`${admin}/moderasyon?kuyruk=reports`);
    await expect(mod.page.getByTestId('moderation-queue')).toContainText('Reklam ya da spam');
    await mod.ctx.close();
  });
});
