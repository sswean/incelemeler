import { Body, Controller, Get, HttpCode, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  IntegrityActionBody,
  SanctionAppealBody,
  SanctionAppealDecisionBody,
  SanctionCreateBody,
} from '@incelemeler/contracts';
import { parseId } from '../../common/ids.js';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import { Auth, type AuthContext, Public, RequireAuth } from '../identity/auth.context.js';
import { SanctionsService } from './sanctions.service.js';

const MODERATE = { level: 'staff-mfa', permission: 'reviews.moderate' } as const;

/** Hesap yaptırımları ve toplu sahte değerlendirme temizliği (REQ-GUN-007). */
@Controller('v1')
export class SanctionsController {
  constructor(private readonly sanctions: SanctionsService) {}

  @Get('admin/sanctions')
  @RequireAuth(MODERATE)
  list() {
    return this.sanctions.list();
  }

  @Post('admin/sanctions')
  @HttpCode(201)
  @RequireAuth(MODERATE)
  issue(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    return this.sanctions.issue(ctx, parseBody(SanctionCreateBody, body), requestMeta(req));
  }

  @Post('admin/sanctions/:id/revoke')
  @HttpCode(200)
  @RequireAuth(MODERATE)
  revoke(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.sanctions.revoke(
      ctx,
      parseId(id),
      parseBody(SanctionAppealDecisionBody.pick({ version: true, note: true }), body),
      requestMeta(req),
    );
  }

  @Post('admin/sanctions/:id/appeal-decision')
  @HttpCode(200)
  @RequireAuth(MODERATE)
  decide(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.sanctions.decideAppeal(
      ctx,
      parseId(id),
      parseBody(SanctionAppealDecisionBody, body),
      requestMeta(req),
    );
  }

  @Post('sanction-appeals')
  @Public()
  @HttpCode(202)
  appeal(@Body() body: unknown) {
    const b = parseBody(SanctionAppealBody, body);
    return this.sanctions.appeal(b.token, b.statement);
  }

  @Post('admin/listings/:id/review-integrity')
  @HttpCode(200)
  @RequireAuth(MODERATE)
  integrity(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.sanctions.integrity(
      ctx,
      parseId(id),
      parseBody(IntegrityActionBody, body),
      requestMeta(req),
    );
  }
}
