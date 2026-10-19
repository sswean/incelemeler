import 'server-only';
import { createApiClient } from '@incelemeler/api-client';

/** Sunucu tarafında API'ye erişim (web veritabanına doğrudan bağlanmaz — REQ-MIM-001). */
export function serverApi() {
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';
  return createApiClient(base);
}
