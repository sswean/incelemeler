import { Body, Controller, Get, HttpCode, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ImportPreviewBody } from '@incelemeler/contracts';
import { parseId } from '../../common/ids.js';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import { Auth, type AuthContext, RequireAuth } from '../identity/auth.context.js';
import { ImportsService } from './imports.service.js';

/** Toplu içe aktarma (REQ-LST-007): editör ve üstü. */
@Controller('v1/admin/imports')
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  @Get()
  @RequireAuth({ level: 'staff-mfa', permission: 'listings.write' })
  list() {
    return this.imports.list();
  }

  @Post()
  @HttpCode(201)
  @RequireAuth({ level: 'staff-mfa', permission: 'listings.write' })
  preview(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    return this.imports.preview(ctx, parseBody(ImportPreviewBody, body), requestMeta(req));
  }

  @Get(':id')
  @RequireAuth({ level: 'staff-mfa', permission: 'listings.write' })
  get(@Param('id') id: string) {
    return this.imports.get(parseId(id));
  }

  @Post(':id/commit')
  @HttpCode(200)
  @RequireAuth({ level: 'staff-mfa', permission: 'listings.write' })
  commit(@Auth() ctx: AuthContext, @Param('id') id: string, @Req() req: Request) {
    return this.imports.commit(ctx, parseId(id), requestMeta(req));
  }

  @Post(':id/rollback')
  @HttpCode(200)
  @RequireAuth({ level: 'staff-mfa', permission: 'listings.write' })
  rollback(@Auth() ctx: AuthContext, @Param('id') id: string, @Req() req: Request) {
    return this.imports.rollback(ctx, parseId(id), requestMeta(req));
  }
}
