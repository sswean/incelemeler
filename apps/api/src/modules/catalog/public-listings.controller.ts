import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SitemapQuery, SlugResolveQuery } from '@incelemeler/contracts';
import { parseId } from '../../common/ids.js';
import { parseQuery } from '../../common/zod-query.js';
import { Public } from '../identity/auth.context.js';
import { PublicListingsService } from './public-listings.service.js';

const CACHE = 'public, max-age=60';

@Controller('v1')
export class PublicListingsController {
  constructor(private readonly listings: PublicListingsService) {}

  // `resolve`, `:slug`'dan önce tanımlanır (rota sırası).
  @Get('listings/resolve')
  @Public()
  async resolve(@Query() raw: unknown, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', CACHE);
    return this.listings.resolve(parseQuery(SlugResolveQuery, raw).slug);
  }

  @Get('listings/:slug')
  @Public()
  async get(@Param('slug') slug: string, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', CACHE);
    return this.listings.get(slug);
  }

  @Get('media/:id')
  @Public()
  async media(@Param('id') id: string, @Res() res: Response) {
    const obj = await this.listings.media(parseId(id));
    res
      .status(200)
      .setHeader('Content-Type', obj.contentType)
      // Görsel kimliği değişmez içerik taşır; lisans geri çekilirse 404 döner (önbellek süresi sınırlı).
      .setHeader('Cache-Control', 'public, max-age=3600')
      .setHeader('X-Content-Type-Options', 'nosniff')
      .send(obj.body);
  }

  @Get('sitemap/listings')
  @Public()
  async sitemap(@Query() raw: unknown, @Res({ passthrough: true }) res: Response) {
    const q = parseQuery(SitemapQuery, raw);
    res.setHeader('Cache-Control', 'public, max-age=300');
    return this.listings.sitemap(q.cursor, q.limit);
  }
}
