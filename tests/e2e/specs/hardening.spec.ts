import { gzipSync } from 'node:zlib';
import type { Page } from '@playwright/test';
import { WEB_PORT } from '../env.js';
import { admin } from '../support/admin.js';
import { expect, test } from '../support/fixtures.js';

const web = `http://localhost:${WEB_PORT}`;
// Kritik şablonlar (REQ-PRF-002): hub, listeleme detayı, arama. Ana sayfa bütçe dışı, ölçülür.
const TEMPLATES = {
  home: '/',
  hub: '/istanbul/kahvalti-mekanlari',
  listing: '/mekan/ornek-moda-ocakbasi-demo',
  search: '/ara?q=simit',
} as const;
const JS_BUDGET_GZIP = 170 * 1024;

/**
 * İlk yükleme JS'si: sunucu HTML'indeki `<script src>` dosyalarının gzip toplamı (bayt). Bağlantı
 * ön getirmeleri (sonraki sayfaların parçaları) sayılmaz.
 */
async function firstLoadJs(page: Page, path: string): Promise<number> {
  const html = await (await page.request.get(`${web}${path}`)).text();
  // `nomodule` çoklu dolguları modern tarayıcılarca indirilmez.
  const tags = [...html.matchAll(/<script([^>]*)>/g)].map((m) => m[1]!);
  const srcs = [
    ...new Set(
      tags
        .filter((attrs) => !/\snomodule/i.test(attrs))
        .map((attrs) => /\ssrc="([^"]+)"/.exec(attrs)?.[1])
        .filter((src): src is string => Boolean(src)),
    ),
  ];
  expect(srcs.length).toBeGreaterThan(0);
  let total = 0;
  for (const src of srcs) {
    const res = await page.request.get(new URL(src, web).toString());
    expect(res.ok(), src).toBe(true);
    total += gzipSync(await res.body()).length;
  }
  return total;
}

test.describe('Faz 1 · sertleştirme', () => {
  test('[REQ-GUV-005] web: istek başına nonce CSP, güvenlik başlıkları; satır içi betikler nonce taşır, CSP ihlali yok', async ({
    page,
  }) => {
    const violations: string[] = [];
    page.on('console', (m) => {
      if (/Content Security Policy/i.test(m.text())) violations.push(m.text());
    });
    const nonces = new Set<string>();
    for (const path of Object.values(TEMPLATES)) {
      const res = await page.goto(`${web}${path}`);
      const h = res!.headers();
      const csp = h['content-security-policy'] ?? '';
      const nonce = /'nonce-([A-Za-z0-9+/=]+)'/.exec(csp)?.[1];
      expect(nonce, path).toBeTruthy();
      nonces.add(nonce!);
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).not.toContain("'unsafe-eval'");
      expect(h).toMatchObject({
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'cross-origin-opener-policy': 'same-origin',
      });
      expect(h['permissions-policy']).toContain('geolocation=()');
      expect(h['x-powered-by']).toBeUndefined();
      const inline = await page
        .locator('script:not([src]):not([type="application/ld+json"])')
        .evaluateAll((els) => els.map((e) => (e as HTMLScriptElement).nonce));
      expect(inline.every((n) => n === nonce)).toBe(true);
    }
    expect(nonces.size).toBe(Object.keys(TEMPLATES).length);
    // İstemci etkileşimi (hidrasyon) CSP altında çalışır: otomatik tamamlama yalnızca JS ile açılır.
    await page.goto(`${web}/ara`);
    await page.getByRole('combobox', { name: 'Ne arıyorsun?' }).fill('uskud');
    await expect(
      page.getByRole('listbox', { name: 'Ne arıyorsun?' }).getByRole('option').first(),
    ).toBeVisible();
    expect(violations).toEqual([]);
  });

  test('[REQ-GUV-005] panel: nonce CSP ve çerçevelenme yasağı; indekslenmez', async ({ page }) => {
    const res = await page.goto(`${admin}/giris`);
    const h = res!.headers();
    expect(h['content-security-policy']).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(h).toMatchObject({
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      'x-robots-tag': 'noindex, nofollow',
      'cross-origin-opener-policy': 'same-origin',
    });
    await expect(page.getByRole('button', { name: 'Giriş yap' })).toBeEnabled();
  });

  test('[REQ-GUV-016] security.txt ve TASLAK sorumlu açıklama sayfası', async ({ page }) => {
    const res = await page.request.get(`${web}/.well-known/security.txt`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/plain');
    const txt = await res.text();
    expect(txt).toContain(`Contact: ${web}/sorumlu-aciklama`);
    expect(txt).toContain('TASLAK');
    const expires = Date.parse(/^Expires: (.+)$/m.exec(txt)![1]!);
    expect(expires).toBeGreaterThan(Date.now());
    expect(expires).toBeLessThan(Date.now() + 366 * 86_400_000);

    await page.goto(web);
    await page
      .getByRole('navigation', { name: 'Alt bilgi' })
      .getByRole('link', { name: 'Güvenlik açığı bildirimi' })
      .click();
    await expect(page).toHaveURL(`${web}/sorumlu-aciklama`);
    await expect(page.getByTestId('legal-draft')).toHaveText('TASLAK');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('[REQ-ERS-004] anahtar şablonlarda tek h1, ana bölge ve içeriğe atla bağlantısı', async ({
    page,
  }) => {
    for (const path of Object.values(TEMPLATES)) {
      await page.goto(`${web}${path}`);
      await expect(page.locator('h1'), path).toHaveCount(1);
      await expect(page.getByRole('main'), path).toHaveCount(1);
      await expect(page.getByRole('link', { name: 'İçeriğe atla' }), path).toHaveCount(1);
    }
  });

  test('[REQ-ERS-008] 320 px genişlikte yatay kaydırma yok; azaltılmış hareket tercihinde geçişler kapalı', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const path of Object.values(TEMPLATES)) {
      await page.goto(`${web}${path}`);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
    const durations = await page
      .locator('a, button')
      .evaluateAll((els) =>
        els.map((e) => parseFloat(getComputedStyle(e).transitionDuration) || 0),
      );
    expect(Math.max(0, ...durations)).toBeLessThanOrEqual(0.01);
  });

  test('[REQ-PRF-002] [REQ-PRF-004] kritik şablonlarda ilk yükleme JS (gzip) ≤ 170 KB', async ({
    page,
  }, info) => {
    const report: Record<string, number> = {};
    for (const [name, path] of Object.entries(TEMPLATES)) {
      report[name] = await firstLoadJs(page, path);
    }
    await info.attach('ilk-yukleme-js.json', {
      body: JSON.stringify(report, null, 2),
      contentType: 'application/json',
    });
    for (const name of ['hub', 'listing', 'search'] as const) {
      expect(report[name], name).toBeLessThanOrEqual(JS_BUDGET_GZIP);
    }
  });
});
