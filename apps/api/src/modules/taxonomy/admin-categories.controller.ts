import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  AdminCategoryListQuery,
  CategoryCreateBody,
  CategoryUpdateBody,
} from '@incelemeler/contracts';
import { parseBody } from '../../common/zod-body.js';
import { parseQuery } from '../../common/zod-query.js';
import { parseId } from '../../common/ids.js';
import { requestMeta } from '../../common/request-meta.js';
import { Auth, type AuthContext, RequireAuth } from '../identity/auth.context.js';
import { AdminCategoriesService } from './admin-categories.service.js';

/** Kategori yönetimi (REQ-KAT-001…004). Okuma tüm panel personeli; yazma `taxonomy.manage`. */
@Controller('v1/admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categories: AdminCategoriesService) {}

  @Get()
  @RequireAuth({ level: 'staff-mfa' })
  list(@Query() raw: unknown) {
    return this.categories.list(parseQuery(AdminCategoryListQuery, raw));
  }

  @Post()
  @HttpCode(201)
  @RequireAuth({ level: 'staff-mfa', permission: 'taxonomy.manage' })
  create(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    return this.categories.create(ctx, parseBody(CategoryCreateBody, body), requestMeta(req));
  }

  @Get(':id')
  @RequireAuth({ level: 'staff-mfa' })
  get(@Param('id') id: string) {
    return this.categories.get(parseId(id));
  }

  @Patch(':id')
  @RequireAuth({ level: 'staff-mfa', permission: 'taxonomy.manage' })
  update(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.categories.update(
      ctx,
      parseId(id),
      parseBody(CategoryUpdateBody, body),
      requestMeta(req),
    );
  }
}
