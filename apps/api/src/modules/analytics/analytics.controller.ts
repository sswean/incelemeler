import { Body, Controller, Get, HttpCode, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AnalyticsIngestBody, AnalyticsOverviewQuery, RevenueQuery } from '@incelemeler/contracts';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import { parseQuery } from '../../common/zod-query.js';
import { Public, RequireAuth } from '../identity/auth.context.js';
import { AuthService } from '../identity/auth.service.js';
import { AnalyticsService } from './analytics.service.js';

const header = (req: Request, name: string) => {
  const v = req.headers[name];
  return typeof v === 'string' ? v.slice(0, 300) : null;
};

@Controller('v1')
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly auth: AuthService,
  ) {}

  /** Web vekili çağırır (rıza denetimi vekilde, tercih çerezinden); personel oturumu işaretlenir. */
  @Post('analytics/events')
  @Public()
  @HttpCode(202)
  async ingest(@Body() body: unknown, @Req() req: Request) {
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null;
    const ctx = token ? await this.auth.resolveSession(token) : null;
    return this.analytics.ingest(
      parseBody(AnalyticsIngestBody, body),
      {
        ip: req.ip ?? 'unknown',
        userAgent: header(req, 'user-agent'),
        secPurpose: header(req, 'sec-purpose'),
        purpose: header(req, 'purpose'),
      },
      ctx?.isStaff ?? false,
      requestMeta(req),
    );
  }

  @Get('admin/analytics/overview')
  @RequireAuth({ level: 'staff-mfa', permission: 'audit.read' })
  overview(@Query() raw: unknown) {
    return this.analytics.overview(parseQuery(AnalyticsOverviewQuery, raw).days);
  }

  @Get('admin/dashboard')
  @RequireAuth({ level: 'staff-mfa' })
  dashboard() {
    return this.analytics.dashboard();
  }

  /** Gelir raporu (ekran ve CSV dışa aktarma) finansal veridir: step-up (REQ-HSP-007, REQ-GUV-017). */
  @Get('admin/reports/revenue')
  @RequireAuth({ level: 'staff-mfa', permission: 'campaigns.amount', stepUp: true })
  revenue(@Query() raw: unknown) {
    const q = parseQuery(RevenueQuery, raw);
    return this.analytics.revenue(q.from, q.to);
  }
}
