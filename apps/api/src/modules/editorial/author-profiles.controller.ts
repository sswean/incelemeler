import { Body, Controller, Get, Param, Put, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthorProfileBody } from '@incelemeler/contracts';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import type { Permission } from '../access/permissions.js';
import { Auth, type AuthContext, Public, RequireAuth } from '../identity/auth.context.js';
import { AuthorProfilesService } from './author-profiles.service.js';

const CONTENT_ROLES: Permission[] = ['content.publish', 'content.draft', 'sponsored.content.write'];

@Controller('v1')
export class AuthorProfilesController {
  constructor(private readonly profiles: AuthorProfilesService) {}

  @Get('admin/author-profile')
  @RequireAuth({ level: 'staff-mfa', permission: CONTENT_ROLES })
  own(@Auth() ctx: AuthContext) {
    return this.profiles.own(ctx);
  }

  @Put('admin/author-profile')
  @RequireAuth({ level: 'staff-mfa', permission: CONTENT_ROLES })
  save(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    return this.profiles.save(ctx, parseBody(AuthorProfileBody, body), requestMeta(req));
  }

  @Get('authors/:slug')
  @Public()
  async get(@Param('slug') slug: string, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, max-age=60');
    return this.profiles.publicBySlug(slug);
  }
}
