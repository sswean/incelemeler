import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { requestMeta } from '../../common/request-meta.js';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import { getAuth } from '../identity/auth.context.js';
import { RateLimitService } from './rate-limit.service.js';

export type RouteClass = 'auth' | 'write' | 'search' | 'redirect' | 'panel';

/** Sınıf başına dakikalık sınır (A-029). Uç noktaya özgü sıkı sınırlar (giriş, kayıt…) ayrıca servislerde. */
export const ROUTE_LIMITS: Record<RouteClass, { limit: number; windowSeconds: number }> = {
  auth: { limit: 30, windowSeconds: 60 },
  write: { limit: 60, windowSeconds: 60 },
  search: { limit: 120, windowSeconds: 60 },
  redirect: { limit: 60, windowSeconds: 60 },
  panel: { limit: 600, windowSeconds: 60 },
};

/** Rota sınıfı (REQ-GUV-009). Önbelleklenen herkese açık okumalar ve sağlık denetimi sınıfsızdır. */
export function routeClass(method: string, path: string): RouteClass | null {
  if (path.startsWith('/v1/admin/')) return 'panel';
  if (path.startsWith('/v1/auth/')) return 'auth';
  if (
    /^\/v1\/outbound\/[^/]+\/resolve$/.test(path) ||
    /^\/v1\/sponsored\/[^/]+\/click$/.test(path)
  ) {
    return 'redirect';
  }
  if (method === 'GET' && (path === '/v1/search' || path.startsWith('/v1/search/')))
    return 'search';
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') return 'write';
  return null;
}

/**
 * Rota sınıfına göre hız sınırı (REQ-GUV-009): panel kullanıcı başına, diğerleri IP öneki başına; aşımda 429 +
 * `Retry-After` ve `security.rate_limited` olayı (ProblemFilter). Kimlik korumasından sonra çalışır.
 */
@Injectable()
export class RouteRateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimit: RateLimitService,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    const req = context.switchToHttp().getRequest<Request>();
    const cls = routeClass(req.method, req.path);
    if (!cls) return true;
    const auth = getAuth(req);
    const meta = requestMeta(req);
    const subject = cls === 'panel' && auth ? `u:${auth.userId}` : `ip:${meta.ipPrefix ?? meta.ip}`;
    const { limit, windowSeconds } = ROUTE_LIMITS[cls];
    await this.rateLimit.enforce(
      `route:${cls}:${subject}`,
      limit * this.env.RATE_LIMIT_MULTIPLIER,
      windowSeconds,
    );
    return true;
  }
}
