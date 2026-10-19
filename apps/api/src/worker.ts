import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { loadEnv } from './config/env.js';
import { runWorkerLoop } from './worker-loop.js';

/** Arka plan işleyicisi: outbox olaylarını işler (ADR-0010, REQ-MIM-016 — PostgreSQL kuyruğu). */
const env = loadEnv();
const app = await NestFactory.createApplicationContext(AppModule.forRoot(env), {
  logger: ['error', 'warn', 'log'],
});
let running = true;
const stop = () => {
  running = false;
};
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
await runWorkerLoop(app, () => running);
await app.close();
