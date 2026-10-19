import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  OutboundLinkCreateBody,
  OutboundLinkUpdateBody,
  OutboundResolveQuery,
  ProviderBody,
  ProviderUpdateBody,
} from '@incelemeler/contracts';
import { parseId } from '../../common/ids.js';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import { parseQuery } from '../../common/zod-query.js';
import type { Permission } from '../access/permissions.js';
import { Auth, type AuthContext, Public, RequireAuth } from '../identity/auth.context.js';
import { OutboundService } from './outbound.service.js';

const LINK_ROLES: Permission[] = ['outbound.add', 'affiliate.manage'];
const header = (req: Request, name: string) => {
  const v = req.headers[name];
  return typeof v === 'string' ? v.slice(0, 300) : null;
};

@Controller('v1')
export class OutboundController {
  constructor(private readonly outbound: OutboundService) {}

  /** `/git/` işleyicisinin çağırdığı çözüm (REQ-AFF-002/003). */
  @Get('outbound/:id/resolve')
  @Public()
  async resolve(
    @Param('id') id: string,
    @Query() raw: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    return this.outbound.resolve(parseId(id), parseQuery(OutboundResolveQuery, raw).ctx, {
      ip: req.ip ?? 'unknown',
      userAgent: header(req, 'user-agent'),
      secPurpose: header(req, 'sec-purpose'),
      purpose: header(req, 'purpose'),
    });
  }

  @Get('admin/integration-providers')
  @RequireAuth({ level: 'staff-mfa', permission: LINK_ROLES })
  providers() {
    return this.outbound.providers();
  }

  @Post('admin/integration-providers')
  @HttpCode(201)
  @RequireAuth({ level: 'staff-mfa', permission: 'affiliate.manage' })
  createProvider(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    return this.outbound.createProvider(ctx, parseBody(ProviderBody, body), requestMeta(req));
  }

  @Patch('admin/integration-providers/:id')
  @RequireAuth({ level: 'staff-mfa', permission: 'affiliate.manage' })
  updateProvider(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.outbound.updateProvider(
      ctx,
      parseId(id),
      parseBody(ProviderUpdateBody, body),
      requestMeta(req),
    );
  }

  @Get('admin/listings/:id/outbound-links')
  @RequireAuth({ level: 'staff-mfa', permission: LINK_ROLES })
  links(@Param('id') id: string) {
    return this.outbound.linksForListing(parseId(id));
  }

  @Post('admin/outbound-links')
  @HttpCode(201)
  @RequireAuth({ level: 'staff-mfa', permission: LINK_ROLES })
  createLink(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    return this.outbound.createLink(ctx, parseBody(OutboundLinkCreateBody, body), requestMeta(req));
  }

  @Patch('admin/outbound-links/:id')
  @RequireAuth({ level: 'staff-mfa', permission: LINK_ROLES })
  updateLink(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.outbound.updateLink(
      ctx,
      parseId(id),
      parseBody(OutboundLinkUpdateBody, body),
      requestMeta(req),
    );
  }

  @Post('admin/outbound-links/:id/check')
  @HttpCode(200)
  @RequireAuth({ level: 'staff-mfa', permission: LINK_ROLES })
  check(@Param('id') id: string) {
    return this.outbound.check(parseId(id));
  }
}
