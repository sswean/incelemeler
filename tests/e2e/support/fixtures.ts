import { createHash } from 'node:crypto';
import { type BrowserContext, test as base } from '@playwright/test';

/** Çerez bandını kapatan "tümünü reddet" kararı (yalnızca zorunlu çerezler). Onay testleri bunu kapatır. */
export async function withConsent(context: BrowserContext): Promise<void> {
  await context.addCookies([
    {
      name: 'cerez_tercihi',
      value: `1.00000000-0000-4000-8000-00000000e2e0.000.${Math.floor(Date.now() / 1000)}`,
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Her teste ayrı bir istemci IP'si (X-Forwarded-For). Tüm tarayıcı istekleri 127.0.0.1'den geldiği için
 * IP başına hız sınırları (REQ-HSP-008) testleri birbirine bağlamasın diye kullanılır. Web/panel bu başlığı
 * API'ye iletir; üretimde başlığı güvenilen uç vekil ekler (bkz. A-009).
 * `preConsent`: varsayılan olarak çerez kararı verilmiş başlar (bant diğer akışları örtmesin).
 */
export const test = base.extend<{ clientIp: string; preConsent: boolean }>({
  preConsent: [true, { option: true }],
  clientIp: [
    async ({ context, preConsent }, use, info) => {
      const h = createHash('sha256')
        .update(`${info.project.name}:${info.titlePath.join('/')}`)
        .digest();
      const ip = `10.${h[0]}.${h[1]}.${(h[2]! % 250) + 1}`;
      await context.setExtraHTTPHeaders({ 'X-Forwarded-For': ip });
      if (preConsent) await withConsent(context);
      await use(ip);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
