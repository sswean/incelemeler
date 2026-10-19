import { execFileSync } from 'node:child_process';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

/** Gerçek PostgreSQL + PostGIS konteyneri; migration'lar sıfırdan uygulanır (§8.2). */
export async function startDatabase(): Promise<{
  container: StartedPostgreSqlContainer;
  url: string;
}> {
  const container = await new PostgreSqlContainer('postgis/postgis:16-3.4')
    .withDatabase('incelemeler_test')
    .withUsername('test')
    .withPassword('test')
    .start();
  const url = container.getConnectionUri();
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: new URL('..', import.meta.url).pathname,
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });
  return { container, url };
}
