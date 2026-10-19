import { createHmac } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { ConsentBody } from '@incelemeler/contracts';
import type { RequestMeta } from '../../common/request-meta.js';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthContext } from '../identity/auth.context.js';
import { RateLimitService } from '../platform/rate-limit.service.js';

/**
 * Rıza kayıtları (REQ-KVK-003): her karar kategori başına ayrı satır olarak eklenir (geçmiş korunur);
 * IP yerine sunucu anahtarlı karma tutulur. Zorunlu çerezler rıza konusu değildir.
 */
@Injectable()
export class ConsentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimit: RateLimitService,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  async record(ctx: AuthContext | null, body: ConsentBody, meta: RequestMeta) {
    await this.rateLimit.enforce(`consent:ip:${meta.ipPrefix ?? meta.ip}`, 60, 3600);
    const ipHash = meta.ip
      ? createHmac('sha256', this.env.CURSOR_SECRET).update(`consent-ip:${meta.ip}`).digest('hex')
      : null;
    const base = {
      userId: ctx?.userId ?? null,
      anonymousId: body.anonymousId,
      textVersion: body.textVersion,
      channel: body.channel,
      ipHash,
    };
    await this.prisma.consentRecord.createMany({
      data: [
        { ...base, purpose: 'FUNCTIONAL', granted: body.functional },
        { ...base, purpose: 'ANALYTICS', granted: body.analytics },
        { ...base, purpose: 'MARKETING', granted: body.marketing },
      ],
    });
    return { accepted: true as const };
  }
}
