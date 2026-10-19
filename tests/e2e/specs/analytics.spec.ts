import { expect, test } from '../support/fixtures.js';
import { admin, loginWithMfaSetup } from '../support/admin.js';

test.describe('Faz 1 · panolar ve raporlar', () => {
  test('[REQ-ADM-002] [REQ-ANL-004] [REQ-ADM-010] genel pano gerçek sayaçlar; panolar tazelik damgalı; gelir raporunda affiliate verisi yok', async ({
    page,
  }, info) => {
    await loginWithMfaSetup(page, `e2e-analitik-${info.project.name}@example.test`);
    const dash = page.getByTestId('dashboard');
    await expect(dash).toBeVisible();
    await expect(dash.getByTestId('dash-pendingModeration')).toHaveText(/^\d+$/);
    await expect(dash.getByTestId('dash-applications')).toHaveText('Veri yok');
    await expect(dash).toContainText('Son güncelleme:');

    await page.getByRole('link', { name: 'Analitik' }).click();
    await expect(page.getByTestId('analytics-freshness')).toContainText('Son güncelleme:');
    await expect(page.getByRole('heading', { name: 'Ziyaretçiler (rızalı ölçüm)' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Dönem' }).selectOption({ label: 'Son 30 gün' });
    await page.getByRole('button', { name: 'Göster' }).click();
    await expect(page).toHaveURL(/gun=30/);

    await page.goto(`${admin}/raporlar/gelir?baslangic=2026-01-01&bitis=2026-12-31`);
    await expect(page.getByRole('heading', { level: 1, name: 'Gelir raporu' })).toBeVisible();
    await expect(page.getByText('Affiliate komisyonu (tahmini)').locator('..')).toContainText(
      'Veri yok',
    );
    const csv = await page.request.get(
      `${admin}/raporlar/gelir/csv?baslangic=2026-01-01&bitis=2026-12-31`,
    );
    expect(csv.status()).toBe(200);
    expect(await csv.text()).toContain('affiliate_tahmini,veri yok');
  });
});
