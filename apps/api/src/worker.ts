import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { loadEnv } from './config/env.js';
import { AdminArticlesService } from './modules/editorial/admin-articles.service.js';
import { OutboxService } from './modules/outbox/outbox.service.js';

/** Arka plan işleyicisi: outbox olaylarını işler (ADR-0010, REQ-MIM-016 — PostgreSQL kuyruğu). */
const env = loadEnv();
const app = await NestFactory.createApplicationContext(AppModule.forRoot(env), {
  logger: ['error', 'warn', 'log'],
});
const outbox = app.get(OutboxService);
const articles = app.get(AdminArticlesService);
const logger = new Logger('Worker');
logger.log('Outbox işleyicisi başladı');
let running = true;
const stop = () => {
  running = false;
};
process.on('SIGTERM', stop);
process.on('SIGINT', stop);

while (running) {
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
await app.close();
