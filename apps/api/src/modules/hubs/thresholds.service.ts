import { HttpStatus, Injectable } from '@nestjs/common';
import {
  DEFAULT_THRESHOLDS,
  PublicationThresholds,
  type ThresholdsUpdateBody,
} from '@incelemeler/contracts';
import type { z } from 'zod';
import { ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthContext } from '../identity/auth.context.js';
import { AuditService } from '../platform/audit.service.js';

const KEY = 'publication_thresholds';
const TTL_MS = 30_000;

/** Yayın eşikleri (§7.2): panelden ayarlanır; kayıt yoksa varsayılanlar. */
@Injectable()
export class ThresholdsService {
  private cache: { at: number; value: PublicationThresholds & { version: number } } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async get(): Promise<PublicationThresholds & { version: number }> {
    if (this.cache && Date.now() - this.cache.at < TTL_MS) return this.cache.value;
    const row = await this.prisma.platformSetting.findUnique({ where: { key: KEY } });
    const parsed = row ? PublicationThresholds.safeParse(row.value) : null;
    const value = parsed?.success
      ? { ...parsed.data, version: row!.version }
      : { ...DEFAULT_THRESHOLDS, version: 0 };
    this.cache = { at: Date.now(), value };
    return value;
  }

  async update(
    ctx: AuthContext,
    body: z.infer<typeof ThresholdsUpdateBody>,
    meta: RequestMeta,
  ): Promise<PublicationThresholds & { version: number }> {
    const { version, ...value } = body;
    const before = await this.get();
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.platformSetting.findUnique({ where: { key: KEY } });
      if ((current?.version ?? 0) !== version) {
        throw new ProblemException(
          HttpStatus.PRECONDITION_FAILED,
          'PRECONDITION_FAILED',
          'Eşikler başka bir oturumda değiştirildi',
        );
      }
      if (current) {
        await tx.platformSetting.update({
          where: { key: KEY },
          data: { value, version: { increment: 1 }, updatedBy: ctx.userId },
        });
      } else {
        await tx.platformSetting.create({ data: { key: KEY, value, updatedBy: ctx.userId } });
      }
      await this.audit.record(
        {
          actorId: ctx.userId,
          actorRole: ctx.roles.join(','),
          action: 'settings.thresholds.updated',
          targetType: 'platform_setting',
          targetId: null,
          summary: { before: stripVersion(before), after: value },
          ipPrefix: meta.ipPrefix,
          traceId: meta.traceId,
        },
        tx,
      );
    });
    this.cache = null;
    return this.get();
  }
}

function stripVersion(v: PublicationThresholds & { version: number }): PublicationThresholds {
  const { version: _v, ...rest } = v;
  return rest;
}
