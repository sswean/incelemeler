import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SearchQuery, SuggestQuery } from '@incelemeler/contracts';
import { parseQuery } from '../../common/zod-query.js';
import { Public } from '../identity/auth.context.js';
import { SearchService } from './search.service.js';

@Controller('v1/search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  @Public()
  async query(@Query() raw: unknown, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, max-age=30');
    return this.search.search(parseQuery(SearchQuery, raw));
  }

  @Get('filters')
  @Public()
  async filters(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, max-age=300');
    return this.search.filters();
  }

  @Get('suggest')
  @Public()
  async suggest(@Query() raw: unknown, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, max-age=60');
    return this.search.suggest(parseQuery(SuggestQuery, raw).q);
  }
}
