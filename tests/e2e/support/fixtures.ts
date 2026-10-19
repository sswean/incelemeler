import { createHash } from 'node:crypto';
import { test as base } from '@playwright/test';

/**
 * Her teste ayrı bir istemci IP'si (X-Forwarded-For). Tüm tarayıcı istekleri 127.0.0.1'den geldiği için
 * IP başına hız sınırları (REQ-HSP-008) testleri birbirine bağlamasın diye kullanılır. Web/panel bu başlığı
 * API'ye iletir; üretimde başlığı güvenilen uç vekil ekler (bkz. A-009).
 */
export const test = base.extend<{ clientIp: string }>({
  clientIp: [
    async ({ context }, use, info) => {
      const h = createHash('sha256')
        .update(`${info.project.name}:${info.titlePath.join('/')}`)
        .digest();
      const ip = `10.${h[0]}.${h[1]}.${(h[2]! % 250) + 1}`;
      await context.setExtraHTTPHeaders({ 'X-Forwarded-For': ip });
      await use(ip);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
