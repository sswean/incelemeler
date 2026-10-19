import { HttpStatus, Injectable } from '@nestjs/common';
import {
  DEFAULT_OPS_SWITCHES,
  OpsSwitches,
  type OpsSwitches as OpsSwitchesType,
} from '@incelemeler/contracts';
import type { z } from 'zod';
import type { OpsSwitchesUpdateBody } from '@incelemeler/contracts';
import { ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthContext } from '../identity/auth.context.js';
import { AuditService } from './audit.service.js';

const KEY = 'ops.switches';
/** Örnek içi önbellek: her istekte veritabanı okunmaz; çok örnekte en fazla bu kadar gecikme (A-032). */
const CACHE_MS = 5_000;

/** Acil kapatma anahtarları ve bakım modu (REQ-OPS-009). */
@Injectable()
export class OpsService {
  private cache: {
    at: number;
    value: OpsSwitchesType & { version: number; updatedAt: Date | null };
  } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async current() {
    if (this.cache && Date.now() - this.cache.at < CACHE_MS) return this.cache.value;
    const row = await this.prisma.platformSetting.findUnique({ where: { key: KEY } });
    const parsed = row ? OpsSwitches.safeParse(row.value) : null;
    const value = {
      ...(parsed?.success ? parsed.data : DEFAULT_OPS_SWITCHES),
      version: row?.version ?? 0,
      updatedAt: row?.updatedAt ?? null,
    };
    this.cache = { at: Date.now(), value };
    return value;
  }

  async status() {
    const s = await this.current();
    return {
      maintenance: s.maintenanceMode,
      reviewsOpen: !s.reviewsDisabled && !s.maintenanceMode,
      registrationOpen: !s.registrationDisabled && !s.maintenanceMode,
    };
  }

  /** Kapalı işlevde 503 (kullanıcıya "geçici olarak kullanılamıyor"). */
  async assertOpen(key: 'reviewsDisabled' | 'registrationDisabled'): Promise<void> {
    const s = await this.current();
    if (s[key] || s.maintenanceMode) {
      throw new ProblemException(
        HttpStatus.SERVICE_UNAVAILABLE,
        'SERVICE_UNAVAILABLE',
        'Bu işlem geçici olarak kapalı',
      );
    }
  }

  async update(ctx: AuthContext, body: z.infer<typeof OpsSwitchesUpdateBody>, meta: RequestMeta) {
    const now = await this.current();
    if (now.version !== body.version) {
      throw new ProblemException(
        HttpStatus.PRECONDITION_FAILED,
        'PRECONDITION_FAILED',
        'Anahtarlar başka biri tarafından değiştirildi',
      );
    }
    const { version: _v, reason, ...changes } = body;
    const next: OpsSwitchesType = {
      maintenanceMode: changes.maintenanceMode ?? now.maintenanceMode,
      sponsoredDisabled: changes.sponsoredDisabled ?? now.sponsoredDisabled,
      reviewsDisabled: changes.reviewsDisabled ?? now.reviewsDisabled,
      registrationDisabled: changes.registrationDisabled ?? now.registrationDisabled,
      integrationsDisabled: changes.integrationsDisabled ?? now.integrationsDisabled,
    };
    await this.prisma.$transaction(async (tx) => {
      if (now.version === 0) {
        await tx.platformSetting.create({ data: { key: KEY, value: next, updatedBy: ctx.userId } });
      } else {
        const res = await tx.platformSetting.updateMany({
          where: { key: KEY, version: now.version },
          data: { value: next, version: { increment: 1 }, updatedBy: ctx.userId },
        });
        if (!res.count) {
          throw new ProblemException(
            HttpStatus.PRECONDITION_FAILED,
            'PRECONDITION_FAILED',
            'Anahtarlar başka biri tarafından değiştirildi',
          );
        }
      }
      const diff = Object.fromEntries(
        (Object.keys(next) as Array<keyof OpsSwitchesType>)
          .filter((k) => next[k] !== now[k])
          .map((k) => [k, next[k]]),
      );
      await this.audit.record(
        {
          actorId: ctx.userId,
          actorRole: ctx.roles.join(','),
          action: 'ops.switches.updated',
          targetType: 'platform_setting',
          targetId: KEY,
          summary: { changes: diff, reason },
          ipPrefix: meta.ipPrefix,
          traceId: meta.traceId,
        },
        tx,
      );
    });
    this.cache = null;
    return this.dto(await this.current());
  }

  dto(s: Awaited<ReturnType<OpsService['current']>>) {
    return { ...s, updatedAt: s.updatedAt?.toISOString() ?? null };
  }
}
