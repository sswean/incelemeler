import AxeBuilder from '@axe-core/playwright';
import type { Browser, Page } from '@playwright/test';
import { WEB_PORT } from '../env.js';
import { expect, test } from '../support/fixtures.js';
import { admin, loginWithMfaSetup } from '../support/admin.js';

const web = `http://localhost:${WEB_PORT}`;
// Projeler ayrı arama bağlamında çalışır: aynı yuvada birbirinin kampanyasıyla yarışmasınlar.
const CASE: Record<
  string,
  { category: string; sponsored: string; slug: string; neighbour: string; sponsor: string }
> = {
  'mobile-390': {
    category: 'kahvalti-mekanlari',
    sponsored: 'Örnek Gün Işığı Kahvaltı Salonu (Demo)',
    slug: 'ornek-gun-isigi-kahvalti-salonu-demo',
    neighbour: 'ornek-koy-kahvaltisi-kadikoy-demo',
    sponsor: 'Örnek Kahvaltı Reklamvereni (Demo)',
  },
  'desktop-1280': {
    category: 'restoranlar',
    sponsored: 'Örnek Nişantaşı Bistro (Demo)',
    slug: 'ornek-nisantasi-bistro-demo',
    neighbour: 'ornek-balikci-lokantasi-kumkapi-demo',
    sponsor: 'Örnek Restoran Reklamvereni (Demo)',
  },
};

const local = (d: Date) => {
  const tr = new Date(d.getTime() + 3 * 3_600_000);
  return tr.toISOString().slice(0, 16);
};

async function staff(browser: Browser, email: string, ip: string): Promise<Page> {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-For': ip } });
  const page = await ctx.newPage();
  await loginWithMfaSetup(page, email);
  return page;
}

async function organicTitles(page: Page): Promise<string[]> {
  return page.getByTestId('search-hit').getByRole('link').allTextContents();
}

test.describe('Faz 1 · sponsorluk kampanyası ve yerleşim', () => {
  test('[REQ-SPN-001] [REQ-SPN-002] [REQ-SPN-003] [REQ-SPN-005] [REQ-SPN-011] [REQ-SPN-012] kampanya onaylanır → arama ve detayda etiketli yerleşim → organik sıra aynı → bitince kalkar', async ({
    page,
    browser,
  }, info) => {
    const p = info.project.name;
    const c = CASE[p]!;
    const n = p === 'mobile-390' ? 1 : 2;
    const searchUrl = `${web}/ara?il=istanbul&kategori=${c.category}`;
    await page.goto(searchUrl);
    const before = await organicTitles(page);
    expect(before.length).toBeGreaterThanOrEqual(3);
    await expect(page.getByTestId('sponsored-card')).toHaveCount(0);

    // Satış: kuruluş + kampanya + yerleşimler + kreatif → onaya gönder → satış onayı.
    const sales = await staff(browser, `e2e-satis-${p}@example.test`, `10.254.${n}.1`);
    await sales.goto(`${admin}/kampanyalar`);
    const org = sales.getByRole('form', { name: 'Yeni kuruluş' });
    await org.getByLabel('Kuruluş adı').fill(c.sponsor);
    await org.getByRole('button', { name: 'Kuruluş ekle' }).click();
    await expect(sales.getByText('Kuruluş eklendi.')).toBeVisible();
    const form = sales.getByRole('form', { name: 'Yeni kampanya' });
    await form.getByLabel('Kampanya adı').fill(`E2E kampanya ${p}`);
    await form.getByLabel('Sponsor kuruluş').selectOption({ label: c.sponsor });
    await form
      .getByLabel('Başlangıç (Türkiye saati)')
      .fill(local(new Date(Date.now() - 3_600_000)));
    await form.getByLabel('Bitiş (Türkiye saati)').fill(local(new Date(Date.now() + 86_400_000)));
    // Satış rolü tutar alanını görmez (yalnızca yönetici).
    await expect(form.getByLabel('Anlaşma tutarı (TL)')).toHaveCount(0);
    await form.getByRole('button', { name: 'Kampanya oluştur' }).click();
    await expect(sales.getByText('Kampanya oluşturuldu.')).toBeVisible();
    const campaignUrl = sales.url().split('?')[0]!;

    const place = sales.getByRole('form', { name: 'Yerleşim ekle' });
    for (const [i, slot] of ['Arama sonuçları', 'Listeleme detayı'].entries()) {
      await place.getByLabel('Yuva').selectOption({ label: slot });
      await place.getByLabel('Öne çıkarılan listeleme (kısa ad)').fill(c.slug);
      await place.getByRole('button', { name: 'Yerleşim ekle' }).click();
      await expect(sales.getByTestId('placements').getByRole('listitem')).toHaveCount(i + 1);
    }
    // Sponsorluğa kapalı kategori (konaklama — lisanslı) reddedilir (REQ-SPN-006).
    await place.getByLabel('Öne çıkarılan listeleme (kısa ad)').fill('ornek-kemer-koy-oteli-demo');
    await place.getByRole('button', { name: 'Yerleşim ekle' }).click();
    await expect(sales.getByRole('main').getByRole('alert')).toHaveText(
      'Bu kategori sponsorluğa kapalı.',
    );
    await expect(sales.getByTestId('placements').getByRole('listitem')).toHaveCount(2);

    const creative = sales.getByRole('form', { name: 'Kreatif ekle' });
    await creative.getByLabel('Kısa başlık').fill('Hafta sonu özel menü');
    await creative.getByRole('button', { name: 'Kreatif ekle' }).click();
    await expect(sales.getByText('Hafta sonu özel menü')).toBeVisible();
    await sales.getByRole('button', { name: 'Onaya gönder' }).click();
    await expect(sales.getByTestId('campaign-status')).toHaveText('Onay bekliyor');
    await sales.getByRole('button', { name: 'Satış onayı ver' }).click();
    await expect(sales.getByRole('button', { name: 'Satış onayı ver' })).toHaveCount(0);

    // Editör: kreatif ve editoryal onay (satış onayını veren kişi değil).
    const editor = await staff(browser, `e2e-spn-editor-${p}@example.test`, `10.254.${n}.2`);
    await editor.goto(campaignUrl);
    await editor.getByRole('button', { name: 'Onayla' }).click();
    await expect(editor.getByText('Onaylandı', { exact: false }).first()).toBeVisible();
    await expect(editor.getByRole('button', { name: 'Onayla' })).toHaveCount(0);
    await editor.getByRole('button', { name: 'Editoryal onay ver' }).click();
    await expect(editor.getByTestId('campaign-status')).toHaveText('Onaylandı');

    await sales.goto(campaignUrl);
    await sales.getByRole('button', { name: 'Planla' }).click();
    await expect(sales.getByTestId('campaign-status')).toHaveText('Planlandı');

    // Arama: sponsorlu öğe ayrı, 3. sırada, etiketi ekran okuyucuda önce okunur; organik sıra değişmez.
    await page.goto(searchUrl);
    const card = page.getByTestId('sponsored-card');
    await expect(card).toHaveCount(1);
    await expect(card).toHaveAttribute('data-position', '3');
    await expect(
      card.getByRole('link', { name: `Sponsorlu ${c.sponsored}`, exact: true }),
    ).toBeVisible();
    await expect(card.getByTestId('sponsored-label')).toHaveText('Sponsorlu');
    await expect(page.locator('ol > *').nth(2)).toHaveAttribute('data-testid', 'sponsored-card');
    expect(await organicTitles(page)).toEqual(before);
    await card.getByText('Neden bunu görüyorum?').click();
    await expect(card).toContainText(`${c.sponsor} bu alanda görünmek için ödeme yaptı.`);
    const axe = await new AxeBuilder({ page }).analyze();
    expect(
      axe.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => v.id),
    ).toEqual([]);

    // Listeleme detayı: rakip kutu (aynı kategori + il), etiketli.
    await page.goto(`${web}/mekan/${c.neighbour}`);
    const box = page.getByTestId('sponsored-box');
    await expect(
      box.getByRole('link', { name: `Sponsorlu ${c.sponsored}`, exact: true }),
    ).toBeVisible();

    // Tıklama ölçüm yönlendirmesinden geçer, listeleme sayfasına varır.
    await box.getByRole('link').click();
    await expect(page).toHaveURL(`${web}/mekan/${c.slug}`);

    // Rapor: tanımlar, tazelik, dönüşüm yok; demo/otomasyon olayları sayılmaz (sahte sayı yok).
    await sales.goto(campaignUrl);
    const report = sales.getByTestId('campaign-report');
    await expect(report).toContainText('Görüntülenen gösterim: öğenin en az %50’si');
    await expect(sales.getByTestId('report-freshness')).toContainText('Son güncelleme:');
    await expect(sales.getByTestId('report-conversions')).toHaveText('Dönüşüm verisi yok');
    await expect(sales.getByTestId('report-totals')).toContainText('Görüntülenen gösterim0');
    const csv = await sales.request.get(`${campaignUrl}/rapor.csv`);
    expect(csv.status()).toBe(200);
    expect(await csv.text()).toContain('tarih,sunulan,goruntulenen_gosterim,tiklama,tiklama_orani');

    // Tamamlanan kampanya hiçbir yüzeyde görünmez.
    await sales.getByRole('button', { name: 'Tamamla' }).click();
    await expect(sales.getByTestId('campaign-status')).toHaveText('Tamamlandı');
    await page.goto(searchUrl);
    await expect(page.getByTestId('sponsored-card')).toHaveCount(0);
    expect(await organicTitles(page)).toEqual(before);
  });
});
