import { Body, Controller, Get, HttpCode, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  AdminTakedownCreateBody,
  TakedownCreateBody,
  TakedownUpdateBody,
} from '@incelemeler/contracts';
import { parseId } from '../../common/ids.js';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import { Auth, type AuthContext, Public, RequireAuth } from '../identity/auth.context.js';
import { TakedownService } from './takedown.service.js';

/** Hukuki talepler: KVKK başvurularıyla aynı yönetici yetkisi (A-024, A-031). */
const LEGAL = { level: 'staff-mfa', permission: 'audit.read' } as const;

@Controller('v1')
export class TakedownController {
  constructor(private readonly takedown: TakedownService) {}

  @Post('takedown-requests')
  @Public()
  @HttpCode(202)
  create(@Body() body: unknown, @Req() req: Request) {
    return this.takedown.create(parseBody(TakedownCreateBody, body), requestMeta(req));
  }

  @Get('admin/takedown-requests')
  @RequireAuth(LEGAL)
  list() {
    return this.takedown.list();
  }

  @Post('admin/takedown-requests')
  @HttpCode(201)
  @RequireAuth(LEGAL)
  createManual(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    return this.takedown.createManual(
      ctx,
      parseBody(AdminTakedownCreateBody, body),
      requestMeta(req),
    );
  }

  @Patch('admin/takedown-requests/:id')
  @RequireAuth(LEGAL)
  update(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.takedown.update(
      ctx,
      parseId(id),
      parseBody(TakedownUpdateBody, body),
      requestMeta(req),
    );
  }
}
