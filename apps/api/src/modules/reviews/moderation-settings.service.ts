import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DEFAULT_MODERATION, type ModerationConfig } from './review-signals.js';

const KEY = 'moderation';
const Schema = z.object({
  riskThreshold: z.number().int().min(0).max(100),
  trustedAfter: z.number().int().min(0).max(100),
});

/** Moderasyon eşikleri (Ek A6.6: "eşikler panelden ayarlanır"); kayıt yoksa varsayılanlar. */
@Injectable()
export class ModerationSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<ModerationConfig> {
    const row = await this.prisma.platformSetting.findUnique({ where: { key: KEY } });
    const parsed = row ? Schema.safeParse(row.value) : null;
    return parsed?.success ? parsed.data : DEFAULT_MODERATION;
  }
}
