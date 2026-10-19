import { createHash } from 'node:crypto';
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { CONSENT_TEXT_VERSION } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { PrismaService } from '../../prisma/prisma.service.js';

/** Yürürlükteki metinler: içerik özeti arayüzdeki metinden hesaplanır (metin değişince yeni sürüm gerekir). */
const CURRENT = {
  TERMS: {
    version: '2026-10-taslak',
    text: [tr.legal.termsIntro, tr.legal.termsAge, tr.legal.termsAccount, tr.legal.termsContent],
  },
  PRIVACY_NOTICE: {
    version: '2026-10-taslak',
    text: [tr.legal.privacyIntro, tr.legal.privacySessions, tr.legal.privacyRights],
  },
  COOKIE_POLICY: { version: CONSENT_TEXT_VERSION, text: [tr.consent.intro, tr.consent.bannerText] },
} as const;
type DocType = keyof typeof CURRENT;

/**
 * Hukuki metin sürümleri ve kabulleri (REQ-KVK-004). Hukukçu onayı alanı boş sürüm TASLAK'tır; TASLAK'ı kaldırmak
 * C sınıfıdır (İnsan onayı). Esaslı (`material`) yeni sürümde üye bir sonraki girişte yeniden kabul eder.
 */
@Injectable()
export class LegalService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    for (const [docType, d] of Object.entries(CURRENT)) {
      const contentHash = createHash('sha256').update(d.text.join('\n')).digest('hex');
      await this.prisma.legalDocumentVersion.upsert({
        where: { docType_version: { docType, version: d.version } },
        create: { docType, version: d.version, effectiveAt: new Date('2026-10-01'), contentHash },
        update: {},
      });
    }
  }

  /** Kayıtta kullanım koşulları kabulü ve aydınlatma metninin okunduğu beyanı (ayrı belgeler — REQ-KVK-001). */
  async recordRegistration(userId: string): Promise<void> {
    const versions = await Promise.all(
      (['TERMS', 'PRIVACY_NOTICE'] as DocType[]).map((t) => this.latest(t)),
    );
    await this.prisma.legalAcceptance.createMany({
      data: versions.flatMap((v) => (v ? [{ userId, versionId: v.id }] : [])),
      skipDuplicates: true,
    });
  }

  async pending(userId: string) {
    const out = [];
    for (const docType of ['TERMS', 'PRIVACY_NOTICE'] as DocType[]) {
      const v = await this.latest(docType);
      if (!v?.material) continue;
      const accepted = await this.prisma.legalAcceptance.findUnique({
        where: { userId_versionId: { userId, versionId: v.id } },
      });
      if (!accepted) {
        out.push({
          id: v.id,
          docType,
          version: v.version,
          effectiveAt: v.effectiveAt.toISOString(),
          draft: v.approvedBy === null,
        });
      }
    }
    return { data: out };
  }

  async accept(userId: string, versionIds: string[]) {
    const valid = await this.prisma.legalDocumentVersion.findMany({
      where: { id: { in: versionIds } },
      select: { id: true },
    });
    await this.prisma.legalAcceptance.createMany({
      data: valid.map((v) => ({ userId, versionId: v.id })),
      skipDuplicates: true,
    });
    return this.pending(userId);
  }

  private latest(docType: DocType) {
    return this.prisma.legalDocumentVersion.findFirst({
      where: { docType, effectiveAt: { lte: new Date() } },
      orderBy: { effectiveAt: 'desc' },
    });
  }
}
