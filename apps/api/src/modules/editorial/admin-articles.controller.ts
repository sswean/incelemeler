import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  AdminArticleListQuery,
  ArticleCorrectionBody,
  ArticleCreateBody,
  ArticleTransitionBody,
  ArticleUpdateBody,
} from '@incelemeler/contracts';
import { parseId } from '../../common/ids.js';
import { requestMeta } from '../../common/request-meta.js';
import { parseBody } from '../../common/zod-body.js';
import { parseQuery } from '../../common/zod-query.js';
import type { Permission } from '../access/permissions.js';
import { Auth, type AuthContext, RequireAuth } from '../identity/auth.context.js';
import { AdminArticlesService } from './admin-articles.service.js';

/** Yazar (taslak), editör (yayın) ve sponsorlu içerik metni yazanlar (rol matrisi). */
const CONTENT_ROLES: Permission[] = ['content.publish', 'content.draft', 'sponsored.content.write'];

@Controller('v1/admin/articles')
export class AdminArticlesController {
  constructor(private readonly articles: AdminArticlesService) {}

  @Get()
  @RequireAuth({ level: 'staff-mfa', permission: CONTENT_ROLES })
  list(@Auth() ctx: AuthContext, @Query() raw: unknown) {
    return this.articles.list(ctx, parseQuery(AdminArticleListQuery, raw));
  }

  @Post()
  @HttpCode(201)
  @RequireAuth({ level: 'staff-mfa', permission: CONTENT_ROLES })
  create(@Auth() ctx: AuthContext, @Body() body: unknown, @Req() req: Request) {
    return this.articles.create(ctx, parseBody(ArticleCreateBody, body), requestMeta(req));
  }

  @Get(':id')
  @RequireAuth({ level: 'staff-mfa', permission: CONTENT_ROLES })
  get(@Auth() ctx: AuthContext, @Param('id') id: string) {
    return this.articles.get(ctx, parseId(id));
  }

  @Patch(':id')
  @RequireAuth({ level: 'staff-mfa', permission: CONTENT_ROLES })
  update(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.articles.update(
      ctx,
      parseId(id),
      parseBody(ArticleUpdateBody, body),
      requestMeta(req),
    );
  }

  @Post(':id/transition')
  @HttpCode(200)
  @RequireAuth({ level: 'staff-mfa', permission: CONTENT_ROLES })
  transition(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    return this.articles.transition(
      ctx,
      parseId(id),
      parseBody(ArticleTransitionBody, body),
      requestMeta(req),
    );
  }

  @Post(':id/corrections')
  @HttpCode(200)
  @RequireAuth({ level: 'staff-mfa', permission: 'content.publish' })
  correct(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const b = parseBody(ArticleCorrectionBody, body);
    return this.articles.correct(ctx, parseId(id), b.version, b.note, requestMeta(req));
  }

  @Post(':id/preview')
  @HttpCode(200)
  @RequireAuth({ level: 'staff-mfa', permission: CONTENT_ROLES })
  preview(@Auth() ctx: AuthContext, @Param('id') id: string) {
    return this.articles.preview(ctx, parseId(id));
  }
}
