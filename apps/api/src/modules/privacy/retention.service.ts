import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ComplianceService } from './compliance.service.js';

const DAY = 86_400_000;

/**
 * Periyodik imha (REQ-KVK-023, REQ-KVK-025): her kategori için süresi dolan kayıtlar silinir ya da
 * anonimleştirilir; her çalışma `destruction_logs`'a yazılır. Süreler `compliance_config`'ten (doğrulanacak).
 */
@Injectable()
export class RetentionService {
  private readonly logger = new Logger('Retention');

  constructor(
    private readonly prisma: PrismaService,
    private readonly compliance: ComplianceService,
  ) {}

  async run(now = new Date()): Promise<Record<string, number>> {
    const r = (await this.compliance.get()).retention;
    const before = (days: number) => new Date(now.getTime() - days * DAY);
    const steps: Array<{
      category: string;
      method: 'DELETE' | 'ANONYMIZE';
      cutoff: Date;
      run: (c: Date) => Promise<{ count: number }>;
    }> = [
      {
        category: 'email_tokens',
        method: 'DELETE',
        cutoff: before(r.expiredTokensDays),
        run: (c) => this.prisma.emailToken.deleteMany({ where: { expiresAt: { lt: c } } }),
      },
      {
        category: 'sessions',
        method: 'DELETE',
        cutoff: before(r.expiredSessionsDays),
        run: (c) =>
          this.prisma.session.deleteMany({
            where: { OR: [{ absoluteExpiresAt: { lt: c } }, { idleExpiresAt: { lt: c } }] },
          }),
      },
      {
        category: 'rate_limit_buckets',
        method: 'DELETE',
        cutoff: before(1),
        run: (c) => this.prisma.rateLimitBucket.deleteMany({ where: { windowStart: { lt: c } } }),
      },
      {
        category: 'review_drafts',
        method: 'DELETE',
        cutoff: before(r.reviewDraftsDays),
        run: (c) => this.prisma.reviewDraft.deleteMany({ where: { updatedAt: { lt: c } } }),
      },
      {
        category: 'search_events',
        method: 'DELETE',
        cutoff: before(r.searchEventsDays),
        run: (c) => this.prisma.searchEvent.deleteMany({ where: { createdAt: { lt: c } } }),
      },
      {
        category: 'outbound_clicks.session_hash',
        method: 'ANONYMIZE',
        cutoff: before(r.clickSessionHashDays),
        run: (c) =>
          this.prisma.outboundClick.updateMany({
            where: { createdAt: { lt: c }, sessionHash: { not: '' } },
            data: { sessionHash: '' },
          }),
      },
      {
        category: 'sponsored_events.session_hash',
        method: 'ANONYMIZE',
        cutoff: before(r.clickSessionHashDays),
        run: (c) =>
          this.prisma.sponsoredEvent.updateMany({
            where: { createdAt: { lt: c }, sessionHash: { not: null } },
            data: { sessionHash: null },
          }),
      },
      {
        // Olay verisi süre sonunda günlük toplama dönüştürülüp silinir (REQ-ANL-006).
        category: 'analytics_events',
        method: 'DELETE',
        cutoff: before(r.analyticsEventsDays),
        run: async (c) => {
          await this.prisma.$executeRaw`
            INSERT INTO analytics_daily (day, name, count)
            SELECT (created_at AT TIME ZONE 'Europe/Istanbul')::date, name, count(*)::int
            FROM analytics_events
            WHERE created_at < ${c} AND NOT bot AND NOT staff AND NOT demo
            GROUP BY 1, 2
            ON CONFLICT (day, name) DO UPDATE SET count = analytics_daily.count + EXCLUDED.count`;
          return this.prisma.analyticsEvent.deleteMany({ where: { createdAt: { lt: c } } });
        },
      },
      {
        category: 'consent_records.ip_hash',
        method: 'ANONYMIZE',
        cutoff: before(r.consentIpHashDays),
        run: (c) =>
          this.prisma.consentRecord.updateMany({
            where: { createdAt: { lt: c }, ipHash: { not: null } },
            data: { ipHash: null },
          }),
      },
    ];
    const out: Record<string, number> = {};
    for (const s of steps) {
      const { count } = await s.run(s.cutoff);
      out[s.category] = count;
      if (count > 0) {
        await this.prisma.destructionLog.create({
          data: { category: s.category, method: s.method, count, cutoff: s.cutoff },
        });
      }
    }
    this.logger.log(JSON.stringify({ event: 'retention.run', ...out }));
    return out;
  }
}
