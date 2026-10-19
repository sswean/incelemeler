import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  AdminListingListQuery,
  ListingCreateBody,
  ListingStatusBody,
  ListingUpdateBody,
} from '@incelemeler/contracts';
import { parseId } from '../../common/ids.js';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import { parseQuery } from '../../common/zod-query.js';
import type { Permission } from '../access/permissions.js';
import { Auth, type AuthContext, RequireAuth } from '../identity/auth.context.js';
import { AdminListingsService } from './admin-listings.service.js';

/** Yazar taslak, editör ve üstü yayın yetkisine sahiptir (rol matrisi, REQ-HSP-009). */
const LISTING_EDITORS: Permission[] = ['listings.write', 'listings.draft'];

@Controller('v1/admin/listings')
export class AdminListingsController {
  constructor(private readonly listings: AdminListingsService) {}

  @Get()
  @RequireAuth({ level: 'staff-mfa', permission: LISTING_EDITORS })
  list(@Query() raw: unknown) {
    return this.listings.list(parseQuery(AdminListingListQuery, raw));
  }

  @Post()
  @HttpCode(201)
  @RequireAuth({ level: 'staff-mfa', permission: LISTING_EDITORS })
  create(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    return this.listings.create(ctx, parseBody(ListingCreateBody, body), requestMeta(req));
  }

  @Get(':id')
  @RequireAuth({ level: 'staff-mfa', permission: LISTING_EDITORS })
  get(@Param('id') id: string) {
    return this.listings.get(parseId(id));
  }

  @Patch(':id')
  @RequireAuth({ level: 'staff-mfa', permission: LISTING_EDITORS })
  update(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.listings.update(
      ctx,
      parseId(id),
      parseBody(ListingUpdateBody, body),
      requestMeta(req),
    );
  }

  @Post(':id/status')
  @HttpCode(200)
  @RequireAuth({ level: 'staff-mfa', permission: LISTING_EDITORS })
  setStatus(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.listings.setStatus(
      ctx,
      parseId(id),
      parseBody(ListingStatusBody, body),
      requestMeta(req),
    );
  }
}
