import { Body, Controller, Get, Param, Patch, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { HomeModuleUpdateBody, HomeQuery } from '@incelemeler/contracts';
import { parseId } from '../../common/ids.js';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import { parseQuery } from '../../common/zod-query.js';
import { Auth, type AuthContext, Public, RequireAuth } from '../identity/auth.context.js';
import { HomeService } from './home.service.js';

@Controller('v1')
export class HomeController {
  constructor(private readonly home: HomeService) {}

  @Get('home')
  @Public()
  get(@Query() raw: unknown) {
    return this.home.get(parseQuery(HomeQuery, raw).il);
  }

  @Get('admin/home-modules')
  @RequireAuth({ level: 'staff-mfa', permission: 'content.publish' })
  list() {
    return this.home.list();
  }

  @Patch('admin/home-modules/:id')
  @RequireAuth({ level: 'staff-mfa', permission: 'content.publish' })
  update(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.home.update(
      ctx,
      parseId(id),
      parseBody(HomeModuleUpdateBody, body),
      requestMeta(req),
    );
  }
}
