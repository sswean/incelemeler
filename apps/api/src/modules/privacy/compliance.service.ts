import { Injectable } from '@nestjs/common';
import { ComplianceConfig } from '@incelemeler/contracts';
import { PrismaService } from '../../prisma/prisma.service.js';

const KEY = 'compliance';
/**
 * `compliance_config` varsayılanları (A-024). Süreler ürün varsayılanıdır; mevzuattaki üst sınırlarla uyumu
 * hukuki incelemeyle DOĞRULANACAK (L kaydı) — kod yasa maddesi varsaymaz.
 */
export const DEFAULT_COMPLIANCE: Omit<ComplianceConfig, 'version'> = {
  dsrResponseDays: 30,
  accountDeletionDays: 30,
  takedownResponseHours: {
    COPYRIGHT: 72,
    PERSONALITY_RIGHTS: 24,
    OTHER_LEGAL: 168,
    COURT_ORDER: 24,
    ADMINISTRATIVE_ORDER: 24,
  },
  retention: {
    expiredTokensDays: 7,
    expiredSessionsDays: 30,
    reviewDraftsDays: 180,
    searchEventsDays: 365,
    clickSessionHashDays: 90,
    consentIpHashDays: 365,
    analyticsEventsDays: 425,
    unverifiedApplicationsDays: 7,
    rejectedApplicationsDays: 365,
  },
};

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<ComplianceConfig> {
    const row = await this.prisma.platformSetting.findUnique({ where: { key: KEY } });
    const parsed = row ? ComplianceConfig.omit({ version: true }).safeParse(row.value) : null;
    return parsed?.success
      ? { ...parsed.data, version: row!.version }
      : { ...DEFAULT_COMPLIANCE, version: 0 };
  }
}
