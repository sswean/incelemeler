import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { loadEnv } from '../config/env.js';
import { SearchIndexerService } from '../modules/search/search-indexer.service.js';

/** Arama okuma modelini baştan kurar (REQ-ARA-002): `pnpm --filter @incelemeler/api search:reindex`. */
const app = await NestFactory.createApplicationContext(AppModule.forRoot(loadEnv()), {
  logger: ['error', 'warn', 'log'],
});
try {
  const counts = await app.get(SearchIndexerService).reindexAll();
  console.warn(`[search] yeniden indekslendi: ${JSON.stringify(counts)}`);
} finally {
  await app.close();
}
