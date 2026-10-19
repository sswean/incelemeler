import type { APIRequestContext } from '@playwright/test';
import { API_PORT, WEB_PORT } from '../env.js';
import { expect, test } from '../support/fixtures.js';
import { admin, loginWithMfaSetup } from '../support/admin.js';

const web = `http://localhost:${WEB_PORT}`;
// Her proje kendi demo konaklamasında ve sağlayıcısında çalışır (paralel koşular birbirini etkilemesin).
const LISTING: Record<string, { slug: string; provider: string }> = {
  'mobile-390': { slug: 'ornek-alacati-butik-otel-demo', provider: 'Örnek Rezervasyon Bir' },
  'desktop-1280': { slug: 'ornek-foca-deniz-pansiyonu-demo', provider: 'Örnek Rezervasyon İki' },
};
const UA = 'Mozilla/5.0 (X11; Linux x86_64) E2E-Ziyaretci/1.0';

async function go(request: APIRequestContext, href: string, headers: Record<string, string> = {}) {
  return request.get(`${web}${href}`, {
    maxRedirects: 0,
    headers: { 'User-Agent': UA, ...headers },
  });
}

test.describe('Faz 1 · dış yönlendirme ve ortaklık bağlantıları', () => {
  test('[REQ-AFF-001] [REQ-AFF-002] [REQ-AFF-004] [REQ-AFF-005] sağlayıcı + affiliate bağlantısı → etiketli CTA → /git/ 302 → kapatınca 404', async ({
    page,
    request,
  }, info) => {
    const p = info.project.name;
    const { slug, provider } = LISTING[p]!;
    const domain = `ornek-rez-${p}.example`;
    const listing = await (
      await request.get(`http://localhost:${API_PORT}/v1/listings/${slug}`)
    ).json();

    await loginWithMfaSetup(page, `e2e-ortaklik-${p}@example.test`);
    await page.goto(`${admin}/entegrasyonlar`);
    const add = page.getByRole('form', { name: 'Sağlayıcı ekle' });
    await add.getByLabel('Anahtar (küçük harf, tire)').fill(`ornek-rez-${p}`);
    await add.getByLabel('Ad', { exact: true }).fill(provider);
    await add.getByLabel(/İzinli alan adları/).fill(domain);
    await add.getByRole('button', { name: 'Sağlayıcı ekle' }).click();
    await expect(page.getByRole('main').getByText('Sağlayıcı eklendi.')).toBeVisible();

    await page.goto(`${admin}/listelemeler/${listing.id}`);
    const form = page.getByRole('form', { name: 'Bağlantı ekle' });
    const fill = async (url: string) => {
      await form.getByLabel('Sayfadaki eylem').selectOption({ label: 'Sağlayıcıda fiyatları gör' });
      await form.getByLabel('Bağlantı türü').selectOption({ label: 'Ortaklık (affiliate)' });
      await form.getByLabel('Sağlayıcı').selectOption({ label: provider });
      await form.getByLabel('Ticari ilişki').selectOption({ label: 'Ortaklık bağlantısı' });
      await form.getByLabel('Hedef adres').fill(url);
      await form.getByRole('button', { name: 'Bağlantı ekle' }).click();
    };
    // Açık yönlendirme yok: sağlayıcının izinli alan adı dışındaki hedef reddedilir.
    await fill('https://kotu-hedef.example/otel?sub={subId}');
    await expect(page.getByRole('main').getByRole('alert')).toContainText(
      'Hedef alan adı sağlayıcının izinli alan adlarında değil.',
    );
    await fill(`https://${domain}/otel?sub={subId}&s={surface}`);
    await expect(page.getByText('Bağlantı eklendi.')).toBeVisible();
    const row = page.getByTestId('outbound-link').filter({ hasText: provider });
    await expect(row.getByTestId('outbound-status')).toHaveText('Etkin');

    // Herkese açık sayfa: CTA etiketli, rel="sponsored", hedef yalnızca /git/ yolu.
    await page.goto(`${web}/konaklama/${slug}`);
    const cta = page.getByTestId('listing-ctas').getByRole('link', { name: /fiyatları gör/ });
    await expect(cta).toHaveAttribute('rel', 'sponsored nofollow noopener noreferrer');
    await expect(cta).toHaveAttribute('target', '_blank');
    const href = (await cta.getAttribute('href'))!;
    expect(href).toMatch(/^\/git\/[0-9a-f-]{36}\?ctx=/);
    expect(href).not.toContain(domain);
    await expect(page.getByTestId('commercial-label').first()).toHaveText('Ortaklık bağlantısı');
    await expect(page.getByText(/komisyon alabiliriz/)).toBeVisible();

    const res = await go(request, href);
    expect(res.status()).toBe(302);
    expect(res.headers()['location']).toBe(
      `https://${domain}/otel?sub=ldp-${slug}&s=listing_detail`,
    );
    expect(res.headers()['cache-control']).toContain('no-store');
    expect(res.headers()['x-robots-tag']).toContain('noindex');
    expect(res.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
    // Tekrar (30 sn içinde) ve önceden getirme sayılmaz (REQ-AFF-005).
    expect((await go(request, href)).status()).toBe(302);
    expect((await go(request, href, { 'Sec-Purpose': 'prefetch' })).status()).toBe(302);
    await expect(async () => {
      await page.goto(`${admin}/listelemeler/${listing.id}`);
      await expect(row).toContainText('Son 30 gün tıklama: 1', { timeout: 1000 });
    }).toPass();

    // Bilinmeyen ya da geçersiz kimlik ve kapatılan bağlantı: 404, hedef sızdırılmaz.
    for (const bad of ['/git/00000000-0000-4000-8000-000000000000', '/git/gecersiz']) {
      const r = await go(request, bad);
      expect(r.status()).toBe(404);
      expect(r.headers()['x-robots-tag']).toContain('noindex');
    }
    await row.getByRole('button', { name: 'Kapat' }).click();
    await expect(page.getByText('Bağlantı güncellendi.')).toBeVisible();
    await expect(row.getByTestId('outbound-status')).toHaveText('Kapalı');
    const closed = await go(request, href);
    expect(closed.status()).toBe(404);
    expect(closed.headers()['location']).toBeUndefined();
  });
});
