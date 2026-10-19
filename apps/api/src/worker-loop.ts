import { Logger } from '@nestjs/common';
import type { INestApplicationContext } from '@nestjs/common';
import { AdminArticlesService } from './modules/editorial/admin-articles.service.js';
import { OutboundService } from './modules/outbound/outbound.service.js';
import { OutboxService } from './modules/outbox/outbox.service.js';

/** Outbox + zamanlanmış yayın döngüsü (ADR-0010); `isRunning` false olunca durur. */
export async function runWorkerLoop(
  app: INestApplicationContext,
  isRunning: () => boolean,
): Promise<void> {
  const outbox = app.get(OutboxService);
  const articles = app.get(AdminArticlesService);
  const outbound = app.get(OutboundService);
  let nextHealthCheck = 0;
  const logger = new Logger('Worker');
  logger.log('Outbox işleyicisi başladı');
  while (isRunning()) {
    const n = await outbox.runOnce().catch((e: unknown) => {
      logger.error(JSON.stringify({ event: 'worker.error', message: String(e) }));
      return 0;
    });
    // Zamanı gelen içerikler (REQ-ICR-005).
    await articles.publishDue().catch((e: unknown) => {
      logger.error(JSON.stringify({ event: 'worker.schedule_error', message: String(e) }));
    });
    // Dış bağlantı sağlığı ve süre sonu (REQ-AFF-007): 10 dakikada bir küçük parti.
    if (Date.now() >= nextHealthCheck) {
      nextHealthCheck = Date.now() + 10 * 60_000;
      await outbound.checkDue().catch((e: unknown) => {
        logger.error(JSON.stringify({ event: 'worker.outbound_error', message: String(e) }));
      });
    }
    if (n === 0) await new Promise((r) => setTimeout(r, 1000));
  }
}
