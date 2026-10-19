import { HttpStatus, Injectable } from '@nestjs/common';
import { ProblemException } from '../../common/problem.js';
import { PrismaService } from '../../prisma/prisma.service.js';

/**
 * PostgreSQL tabanlı sabit pencereli hız sınırlayıcı (REQ-HSP-008, A-006). Birden çok API örneğinde
 * tutarlıdır; Redis yalnızca ölçülmüş ihtiyaçla eklenir (§14.4).
 */
@Injectable()
export class RateLimitService {
  constructor(private readonly prisma: PrismaService) {}

  async hit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ allowed: boolean; retryAfter: number }> {
    const rows = await this.prisma.$queryRaw<Array<{ count: number; window_start: Date }>>`
      INSERT INTO rate_limit_buckets (key, window_start, count)
      VALUES (${key}, now(), 1)
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limit_buckets.window_start < now() - make_interval(secs => ${windowSeconds}::int)
                     THEN 1 ELSE rate_limit_buckets.count + 1 END,
        window_start = CASE WHEN rate_limit_buckets.window_start < now() - make_interval(secs => ${windowSeconds}::int)
                     THEN now() ELSE rate_limit_buckets.window_start END
      RETURNING count, window_start`;
    const row = rows[0]!;
    const elapsed = (Date.now() - row.window_start.getTime()) / 1000;
    return {
      allowed: row.count <= limit,
      retryAfter: Math.max(1, Math.ceil(windowSeconds - elapsed)),
    };
  }

  /** Sayacı artırmadan, pencere içindeki sayı sınırı aştı mı? */
  async isBlocked(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ blocked: boolean; retryAfter: number }> {
    const row = await this.prisma.rateLimitBucket.findUnique({ where: { key } });
    if (!row) return { blocked: false, retryAfter: 0 };
    const elapsed = (Date.now() - row.windowStart.getTime()) / 1000;
    if (elapsed >= windowSeconds) return { blocked: false, retryAfter: 0 };
    return {
      blocked: row.count >= limit,
      retryAfter: Math.max(1, Math.ceil(windowSeconds - elapsed)),
    };
  }

  /** Sınır aşılırsa 429 + Retry-After (ProblemFilter başlığı ekler). */
  async enforce(key: string, limit: number, windowSeconds: number): Promise<void> {
    const r = await this.hit(key, limit, windowSeconds);
    if (!r.allowed) {
      throw new RateLimitedException(r.retryAfter);
    }
  }
}

export class RateLimitedException extends ProblemException {
  constructor(readonly retryAfter: number) {
    super(
      HttpStatus.TOO_MANY_REQUESTS,
      'RATE_LIMITED',
      'Çok fazla istek. Biraz sonra yeniden dene.',
    );
  }
}
