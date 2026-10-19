import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { WEB_PORT } from '../env.js';
import { expect, test, withConsent } from '../support/fixtures.js';
import { admin, loginWithMfaSetup } from '../support/admin.js';

const web = `http://localhost:${WEB_PORT}`;

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => v.id);
}

async function transition(page: Page, label: string) {
  await page.getByRole('button', { name: label, exact: true }).click();
  await expect(page.getByRole('main').getByRole('status')).toHaveText('Değişiklikler kaydedildi.');
}

test.describe('Faz 1 · editoryal içerik', () => {
  test('[REQ-ICR-005] [REQ-ICR-006] [REQ-ICR-011] yazar rehber yazar, önizler; editör onaylayıp yayımlar; sayfa künye ve JSON-LD ile render edilir', async ({
    page,
    browser,
  }, info) => {
    const p = info.project.name;
    const authorSlug = `e2e-yazar-${p}`;

    // Yazar profili (REQ-ICR-011).
    await loginWithMfaSetup(page, `e2e-yazar-${p}@example.test`);
    await page.getByRole('link', { name: 'Yazar profilim' }).click();
    const profile = page.getByRole('form', { name: 'Yazar profilim' });
    await profile.getByLabel('Sayfa adresi').fill(authorSlug);
    await profile.getByLabel('Unvan').fill('Gezi yazarı');
    await profile.getByLabel('Kısa biyografi').fill('İstanbul semtleri üzerine yazar.');
    await profile.getByLabel('Uzmanlık alanları').fill('İstanbul, Sokak lezzetleri');
    await profile.getByLabel('Etik beyanı').fill('Ücretsiz davet kabul etmez.');
    await profile.getByRole('button', { name: 'Profili kaydet' }).click();
    await expect(page.getByRole('main').getByRole('status')).toHaveText(
      'Değişiklikler kaydedildi.',
    );

    // Taslak → blok → menfaat beyanı → incelemeye gönder.
    await page.goto(`${admin}/icerikler/yeni`);
    await page.getByLabel('İçerik türü').selectOption({ label: 'Rehber' });
    const title = `Kadıköy rehberi ${p}`;
    await page.getByLabel('Başlık').fill(title);
    await page.getByRole('button', { name: 'Yeni içerik' }).click();
    await expect(page.getByTestId('article-blockers')).toContainText('menfaat', {
      ignoreCase: true,
    });
    const editorUrl = page.url();
    const form = page.getByRole('form', { name: 'İçerikler' });
    const articleSlug = `kadikoy-rehberi-${p}`;
    await expect(form.getByLabel('Adres (slug)')).toHaveValue(articleSlug);
    await form.getByLabel('Blok ekle').selectOption({ label: 'Paragraf' });
    await form.getByRole('button', { name: 'Blok ekle' }).click();
    await form
      .getByLabel('Paragraf', { exact: true })
      .fill('**Moda sahili** yürüyüşü için [harita](https://ornek.example/harita).');
    await form.getByLabel('Hayır').check();
    await form.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.getByRole('main').getByRole('status')).toHaveText(
      'Değişiklikler kaydedildi.',
    );
    await page.reload();
    await expect(page.getByText('Gönderim ve yayın için bilgiler tamam.')).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
    // Yazar onaylayamaz (REQ-HSP-009): yalnızca incelemeye gönderebilir.
    await expect(page.getByRole('button', { name: 'Onayla', exact: true })).toHaveCount(0);
    await transition(page, 'İncelemeye gönder');

    // İmzalı önizleme (REQ-ICR-005): yayında değilken görünür, noindex.
    await page.getByRole('button', { name: 'Önizleme bağlantısı oluştur' }).click();
    const previewUrl = await page
      .getByTestId('preview-link')
      .getByRole('link')
      .getAttribute('href');
    expect(previewUrl).toContain('/onizleme?belirtec=');
    await page.goto(previewUrl!);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.getByText(/^Önizleme — bu sayfa yayında değil/)).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await page.goto(`${web}/onizleme?belirtec=gecersiz-belirtec-0000`);
    await expect(page.getByRole('heading', { name: 'Sayfa bulunamadı' })).toBeVisible();

    // Editör onaylar ve yayımlar (ayrı oturum).
    const editorContext = await browser.newContext({
      extraHTTPHeaders: { 'X-Forwarded-For': `10.250.${p === 'mobile-390' ? 1 : 2}.7` },
    });
    await withConsent(editorContext);
    const ed = await editorContext.newPage();
    await loginWithMfaSetup(ed, `e2e-editor-${p}@example.test`);
    await ed.goto(editorUrl);
    await transition(ed, 'Onayla');
    await transition(ed, 'Yayımla');
    await expect(ed.getByTestId('article-meta')).toContainText('Yayında');
    await editorContext.close();

    // Herkese açık sayfa (REQ-ICR-006, REQ-SEO-008).
    await page.goto(`${web}/rehber/${articleSlug}`);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    const byline = page.getByTestId('article-byline');
    await expect(byline).toContainText('Yazar: E2E Yazar');
    await expect(byline).toContainText('Editör: E2E Editör');
    await expect(page.getByTestId('commercial-disclosure')).toHaveCount(0);
    await expect(page.locator('strong', { hasText: 'Moda sahili' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'harita' })).toHaveAttribute(
      'rel',
      'nofollow noopener noreferrer',
    );
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const article = ld.map((s) => JSON.parse(s)).find((j) => j['@type'] === 'Article');
    expect(article).toMatchObject({
      headline: title,
      author: { '@type': 'Person', name: 'E2E Yazar' },
    });
    expect(JSON.stringify(ld)).not.toContain('aggregateRating');
    expect(await seriousViolations(page)).toEqual([]);

    // Yazar sayfası (REQ-ICR-011).
    await byline.getByRole('link', { name: 'E2E Yazar' }).click();
    await expect(page).toHaveURL(`${web}/yazar/${authorSlug}`);
    await expect(page.getByTestId('author-page')).toContainText('Ücretsiz davet kabul etmez.');
    await expect(page.getByRole('link', { name: title })).toBeVisible();

    // Site haritası içerik bölümü (REQ-SEO-006).
    const index = await (await page.request.get(`${web}/sitemap.xml`)).text();
    expect(index).toContain(`${web}/sitemaps/articles-1.xml`);
    const articles = await (await page.request.get(`${web}/sitemaps/articles-1.xml`)).text();
    expect(articles).toContain(`${web}/rehber/`);
  });

  test('[REQ-ICR-012] metodoloji sayfaları TASLAK damgalı ve alt bilgiden erişilir', async ({
    page,
  }) => {
    await page.goto(web);
    await page
      .getByRole('navigation', { name: 'Alt bilgi' })
      .getByRole('link', { name: 'Nasıl değerlendiriyoruz' })
      .click();
    await expect(page).toHaveURL(`${web}/nasil-degerlendiriyoruz`);
    await expect(page.getByTestId('legal-draft')).toHaveText('TASLAK');
    await expect(
      page.getByText('Bayes puanı = (C × m + puanların toplamı) / (C + n)'),
    ).toBeVisible();
    await expect(page.getByText('Kaynaklardan derlendi — denenmedi')).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
    for (const path of [
      '/editoryal-bagimsizlik',
      '/sponsorlu-icerik-politikasi',
      '/duzeltme-politikasi',
    ]) {
      await page.goto(`${web}${path}`);
      await expect(page.getByTestId('legal-draft')).toHaveText('TASLAK');
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    }
  });
});
