import createClient, { type ClientOptions } from 'openapi-fetch';
import type { paths } from './schema.js';

export type { paths } from './schema.js';

/**
 * Tipli API istemcisi. Tipler OpenAPI belgesinden ÜRETİLİR (src/schema.d.ts — elle düzenleme yasak).
 * web, admin ve mobil uygulamalar veritabanına değil, yalnızca bu istemci üzerinden API'ye erişir (REQ-MIM-001).
 */
export function createApiClient(baseUrl: string, options: Omit<ClientOptions, 'baseUrl'> = {}) {
  return createClient<paths>({ baseUrl, ...options });
}

export type ApiClient = ReturnType<typeof createApiClient>;
