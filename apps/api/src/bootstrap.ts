import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { AppModule, type AppOverrides } from './app.module.js';
import type { Env } from './config/env.js';
import { traceMiddleware } from './common/trace.js';

/** Uygulamayı oluşturur (testler ve main.ts ortak kullanır). */
export async function createApp(env: Env, overrides: AppOverrides = {}): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.forRoot(env, overrides), {
    logger: env.APP_ENV === 'test' ? ['error'] : ['log', 'warn', 'error'],
    bodyParser: true,
  });
  app.use(traceMiddleware);
  const http = app.getHttpAdapter().getInstance() as {
    disable(name: string): void;
    set(name: string, value: unknown): void;
  };
  http.disable('x-powered-by');
  // İstemci IP'si yalnızca güvenilen vekillerden (web/admin BFF) alınır.
  http.set('trust proxy', env.TRUST_PROXY);
  app.enableShutdownHooks();
  return app;
}
