import { Body, Controller, Get, Put, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { HubQuery, ThresholdsUpdateBody } from '@incelemeler/contracts';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import { parseQuery } from '../../common/zod-query.js';
import { Auth, type AuthContext, Public, RequireAuth } from '../identity/auth.context.js';
import { HubsService } from './hubs.service.js';
import { ThresholdsService } from './thresholds.service.js';

@Controller('v1')
export class HubsController {
  constructor(
    private readonly hubs: HubsService,
    private readonly thresholds: ThresholdsService,
  ) {}

  @Get('hubs')
  @Public()
  async get(@Query() raw: unknown, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, max-age=60');
    return this.hubs.get(parseQuery(HubQuery, raw));
  }

  @Get('sitemap/hubs')
  @Public()
  async sitemap(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, max-age=300');
    return this.hubs.sitemap();
  }

  @Get('admin/settings/thresholds')
  @RequireAuth({ level: 'staff-mfa', permission: 'taxonomy.manage' })
  getThresholds() {
    return this.thresholds.get();
  }

  @Put('admin/settings/thresholds')
  @RequireAuth({ level: 'staff-mfa', permission: 'taxonomy.manage' })
  updateThresholds(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    return this.thresholds.update(ctx, parseBody(ThresholdsUpdateBody, body), requestMeta(req));
  }
}
