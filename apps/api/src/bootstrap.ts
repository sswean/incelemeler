import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.js';
import { traceMiddleware } from './common/trace.js';

/** Uygulamayı oluşturur (testler ve main.ts ortak kullanır). */
export async function createApp(env: Env): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.forRoot(env), {
    logger: env.APP_ENV === 'test' ? ['error'] : ['log', 'warn', 'error'],
  });
  app.use(traceMiddleware);
  const http = app.getHttpAdapter().getInstance() as { disable(name: string): void };
  http.disable('x-powered-by');
  app.enableShutdownHooks();
  return app;
}
