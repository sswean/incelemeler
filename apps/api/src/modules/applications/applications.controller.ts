import { Body, Controller, Get, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  AdminApplicationQuery,
  ApplicationCreateBody,
  ApplicationDecisionBody,
  TokenBody,
} from '@incelemeler/contracts';
import { parseId } from '../../common/ids.js';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import { parseQuery } from '../../common/zod-query.js';
import { Auth, type AuthContext, Public, RequireAuth } from '../identity/auth.context.js';
import { ApplicationsService } from './applications.service.js';

@Controller('v1')
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Post('applications')
  @Public()
  @HttpCode(202)
  create(@Body() body: unknown, @Req() req: Request) {
    return this.applications.create(parseBody(ApplicationCreateBody, body), requestMeta(req));
  }

  @Post('applications/verify')
  @Public()
  @HttpCode(202)
  verify(@Body() body: unknown) {
    return this.applications.verify(parseBody(TokenBody, body).token);
  }

  /** Görünür türler servis içinde yetkiden çıkarılır (listings.write → işletme, campaigns.manage → reklam). */
  @Get('admin/applications')
  @RequireAuth({ level: 'staff-mfa' })
  list(@Auth() ctx: AuthContext, @Query() raw: unknown) {
    return this.applications.list(ctx, parseQuery(AdminApplicationQuery, raw));
  }

  @Post('admin/applications/:id/decision')
  @HttpCode(200)
  @RequireAuth({ level: 'staff-mfa' })
  decide(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.applications.decide(
      ctx,
      parseId(id),
      parseBody(ApplicationDecisionBody, body),
      requestMeta(req),
    );
  }
}
