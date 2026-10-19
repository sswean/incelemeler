import { Body, Controller, Get, HttpCode, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  AdminDataRequestCreateBody,
  AdminDataRequestUpdateBody,
  BreachCreateBody,
  DataRequestCreateBody,
  LegalAcceptBody,
  TokenBody,
} from '@incelemeler/contracts';
import { parseId } from '../../common/ids.js';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import type { Permission } from '../access/permissions.js';
import { Auth, type AuthContext, Public, RequireAuth } from '../identity/auth.context.js';
import { AuthService } from '../identity/auth.service.js';
import { ComplianceService } from './compliance.service.js';
import { LegalService } from './legal.service.js';
import { PrivacyService } from './privacy.service.js';

/** KVKK başvuruları ve ihlal kayıtları: yönetici (denetim okuma yetkisi olan) rolü — A-024. */
const PRIVACY: Permission = 'audit.read';

@Controller('v1')
export class PrivacyController {
  constructor(
    private readonly privacy: PrivacyService,
    private readonly legal: LegalService,
    private readonly compliance: ComplianceService,
    private readonly auth: AuthService,
  ) {}

  @Post('data-requests')
  @Public()
  @HttpCode(202)
  async create(@Body() body: unknown, @Req() req: Request) {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
    const ctx = token ? await this.auth.resolveSession(token) : null;
    return this.privacy.create(ctx, parseBody(DataRequestCreateBody, body), requestMeta(req));
  }

  @Post('data-requests/verify')
  @Public()
  @HttpCode(202)
  verify(@Body() body: unknown) {
    return this.privacy.verify(parseBody(TokenBody, body).token);
  }

  @Get('me/legal-acceptances/pending')
  @RequireAuth({ level: 'session' })
  pending(@Auth() ctx: AuthContext) {
    return this.legal.pending(ctx.userId);
  }

  @Post('me/legal-acceptances')
  @HttpCode(200)
  @RequireAuth({ level: 'session' })
  accept(@Auth() ctx: AuthContext, @Body() body: unknown) {
    return this.legal.accept(ctx.userId, parseBody(LegalAcceptBody, body).versionIds);
  }

  @Get('admin/data-requests')
  @RequireAuth({ level: 'staff-mfa', permission: PRIVACY })
  list() {
    return this.privacy.list();
  }

  @Post('admin/data-requests')
  @HttpCode(201)
  @RequireAuth({ level: 'staff-mfa', permission: PRIVACY })
  createManual(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    return this.privacy.createManual(
      ctx,
      parseBody(AdminDataRequestCreateBody, body),
      requestMeta(req),
    );
  }

  @Patch('admin/data-requests/:id')
  @RequireAuth({ level: 'staff-mfa', permission: PRIVACY })
  update(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.privacy.update(
      ctx,
      parseId(id),
      parseBody(AdminDataRequestUpdateBody, body),
      requestMeta(req),
    );
  }

  @Get('admin/settings/compliance')
  @RequireAuth({ level: 'staff-mfa', permission: PRIVACY })
  complianceConfig() {
    return this.compliance.get();
  }

  @Get('admin/breaches')
  @RequireAuth({ level: 'staff-mfa', permission: PRIVACY })
  breaches() {
    return this.privacy.breaches();
  }

  @Post('admin/breaches')
  @HttpCode(201)
  @RequireAuth({ level: 'staff-mfa', permission: PRIVACY })
  createBreach(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    return this.privacy.createBreach(ctx, parseBody(BreachCreateBody, body), requestMeta(req));
  }
}
