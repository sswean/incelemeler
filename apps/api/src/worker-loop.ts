import { Logger } from '@nestjs/common';
import type { INestApplicationContext } from '@nestjs/common';
import { AccountService } from './modules/account/account.service.js';
import { AdminArticlesService } from './modules/editorial/admin-articles.service.js';
import { OutboundService } from './modules/outbound/outbound.service.js';
import { OutboxService } from './modules/outbox/outbox.service.js';
import { RetentionService } from './modules/privacy/retention.service.js';
import { SanctionsService } from './modules/reviews/sanctions.service.js';
import { CampaignsService } from './modules/sponsorship/campaigns.service.js';

/** Outbox + zamanlanmış yayın döngüsü (ADR-0010); `isRunning` false olunca durur. */
export async function runWorkerLoop(
  app: INestApplicationContext,
  isRunning: () => boolean,
): Promise<void> {
  const outbox = app.get(OutboxService);
  const articles = app.get(AdminArticlesService);
  const outbound = app.get(OutboundService);
  const campaigns = app.get(CampaignsService);
  const account = app.get(AccountService);
  const retention = app.get(RetentionService);
  const sanctions = app.get(SanctionsService);
  let nextRetention = 0;
  let nextHealthCheck = 0;
  let nextCampaignTick = 0;
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
    // Kampanya durumları (rapor için; sunum zaman penceresine ayrıca bakar — REQ-SPN-005).
    if (Date.now() >= nextCampaignTick) {
      nextCampaignTick = Date.now() + 15_000;
      await campaigns.tick().catch((e: unknown) => {
        logger.error(JSON.stringify({ event: 'worker.campaigns_error', message: String(e) }));
      });
    }
    // Dış bağlantı sağlığı ve süre sonu (REQ-AFF-007): 10 dakikada bir küçük parti.
    if (Date.now() >= nextHealthCheck) {
      nextHealthCheck = Date.now() + 10 * 60_000;
      await outbound.checkDue().catch((e: unknown) => {
        logger.error(JSON.stringify({ event: 'worker.outbound_error', message: String(e) }));
      });
      // Süresi dolan askılar (REQ-GUN-007); girişte de ayrıca kontrol edilir.
      await sanctions.liftExpired().catch((e: unknown) => {
        logger.error(JSON.stringify({ event: 'worker.sanctions_error', message: String(e) }));
      });
      // Geri alma penceresi dolan hesap silmeleri (REQ-KVK-021).
      await account.purgeDue().catch((e: unknown) => {
        logger.error(JSON.stringify({ event: 'worker.account_purge_error', message: String(e) }));
      });
    }
    // Periyodik imha (REQ-KVK-023): günde bir.
    if (Date.now() >= nextRetention) {
      nextRetention = Date.now() + 24 * 3_600_000;
      await retention.run().catch((e: unknown) => {
        logger.error(JSON.stringify({ event: 'worker.retention_error', message: String(e) }));
      });
    }
    if (n === 0) await new Promise((r) => setTimeout(r, 1000));
  }
}
