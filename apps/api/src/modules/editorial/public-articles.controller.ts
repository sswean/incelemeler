import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PreviewQuery } from '@incelemeler/contracts';
import { parseQuery } from '../../common/zod-query.js';
import { Public } from '../identity/auth.context.js';
import { PublicArticlesService } from './public-articles.service.js';

@Controller('v1')
export class PublicArticlesController {
  constructor(private readonly articles: PublicArticlesService) {}

  @Get('articles/:slug')
  @Public()
  async get(@Param('slug') slug: string, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, max-age=60');
    return this.articles.get(slug);
  }

  @Get('preview/article')
  @Public()
  async preview(@Query() raw: unknown, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    return this.articles.preview(parseQuery(PreviewQuery, raw).token);
  }

  @Get('sitemap/articles')
  @Public()
  async sitemap(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, max-age=300');
    return this.articles.sitemap();
  }
}
