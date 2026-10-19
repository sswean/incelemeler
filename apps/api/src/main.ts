import { Logger } from '@nestjs/common';
import { createApp } from './bootstrap.js';
import { loadEnv } from './config/env.js';

const env = loadEnv();
const app = await createApp(env);
await app.listen(env.API_PORT);
new Logger('Bootstrap').log(`API dinliyor: http://localhost:${env.API_PORT} (${env.APP_ENV})`);
