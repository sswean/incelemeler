import { Body, Controller, Get, HttpCode, Param, Post, Put, Req } from '@nestjs/common';
import type { Request } from 'express';
import { VerdictBody, VerdictPublishBody } from '@incelemeler/contracts';
import { parseId } from '../../common/ids.js';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import { Auth, type AuthContext, RequireAuth } from '../identity/auth.context.js';
import { VerdictsService } from './verdicts.service.js';

/**
 * Editör değerlendirmeleri (REQ-VER-005). Okuma dahil tüm uçlar `editorial.verdict.write` ister: satış ve
 * sponsorluk personeli yayından önce değerlendirmeyi göremez (REQ-GUN-012).
 */
@Controller('v1/admin/listings/:id/verdict')
export class AdminVerdictsController {
  constructor(private readonly verdicts: VerdictsService) {}

  @Get()
  @RequireAuth({ level: 'staff-mfa', permission: 'editorial.verdict.write' })
  state(@Param('id') id: string) {
    return this.verdicts.state(parseId(id));
  }

  @Put()
  @RequireAuth({ level: 'staff-mfa', permission: 'editorial.verdict.write' })
  save(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.verdicts.save(ctx, parseId(id), parseBody(VerdictBody, body), requestMeta(req));
  }

  @Post('publish')
  @HttpCode(200)
  @RequireAuth({ level: 'staff-mfa', permission: 'editorial.verdict.write' })
  publish(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const { version } = parseBody(VerdictPublishBody, body);
    return this.verdicts.publish(ctx, parseId(id), version, requestMeta(req));
  }
}
