import { Body, Controller, Get, Put, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { OpsSwitchesUpdateBody } from '@incelemeler/contracts';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import { Auth, type AuthContext, Public, RequireAuth } from '../identity/auth.context.js';
import { OpsService } from './ops.service.js';

/** Süper yönetici ve yönetici (sistem ayarı ya da denetim okuma yetkisi) — rol matrisi değişmedi (A-032). */
const OPS = { level: 'staff-mfa', permission: ['system.settings', 'audit.read'] } as const;

@Controller('v1')
export class OpsController {
  constructor(private readonly ops: OpsService) {}

  @Get('ops/status')
  @Public()
  async status(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return this.ops.status();
  }

  @Get('admin/ops-switches')
  @RequireAuth(OPS)
  async get() {
    return this.ops.dto(await this.ops.current());
  }

  @Put('admin/ops-switches')
  @RequireAuth(OPS)
  update(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    return this.ops.update(ctx, parseBody(OpsSwitchesUpdateBody, body), requestMeta(req));
  }
}
