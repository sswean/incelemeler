import { Logger } from '@nestjs/common';
import type { INestApplicationContext } from '@nestjs/common';
import { AdminArticlesService } from './modules/editorial/admin-articles.service.js';
import { OutboxService } from './modules/outbox/outbox.service.js';

/** Outbox + zamanlanmış yayın döngüsü (ADR-0010); `isRunning` false olunca durur. */
export async function runWorkerLoop(
  app: INestApplicationContext,
  isRunning: () => boolean,
): Promise<void> {
  const outbox = app.get(OutboxService);
  const articles = app.get(AdminArticlesService);
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
    if (n === 0) await new Promise((r) => setTimeout(r, 1000));
  }
}
