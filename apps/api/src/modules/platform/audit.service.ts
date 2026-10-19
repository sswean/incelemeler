import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Prisma } from '../../generated/prisma/client.js';

export interface AuditEntry {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  /** Önce/sonra özeti — kişisel veri içermemeli (REQ-VER-017). */
  summary?: Prisma.InputJsonValue;
  ipPrefix?: string | null;
  traceId?: string | null;
}

/** Değiştirilemez denetim kaydına yazar (yalnızca INSERT). */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        actorRole: entry.actorRole ?? null,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId ?? null,
        summary: entry.summary ?? undefined,
        ipPrefix: entry.ipPrefix ?? null,
        traceId: entry.traceId ?? null,
      },
    });
  }
}
