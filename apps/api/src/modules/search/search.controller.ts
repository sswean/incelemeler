import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SearchQuery, SuggestQuery } from '@incelemeler/contracts';
import { parseQuery } from '../../common/zod-query.js';
import { Public } from '../identity/auth.context.js';
import { SponsoredServingService } from '../sponsorship/sponsored-serving.service.js';
import { SearchService } from './search.service.js';

@Controller('v1/search')
export class SearchController {
  constructor(
    private readonly search: SearchService,
    private readonly sponsored: SponsoredServingService,
  ) {}

  @Get()
  @Public()
  async query(@Query() raw: unknown, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, max-age=30');
    const { result, placement } = await this.search.search(parseQuery(SearchQuery, raw));
    // Sunum katmanı: sponsorlu yerleşimler organik sonuçtan sonra, ayrı çağrıyla ve ayrı dizide
    // (REQ-MIM-005, REQ-SPN-002, REQ-ARA-009).
    const sponsored = placement
      ? await this.sponsored.forList({ surface: 'SEARCH', ...placement })
      : [];
    return { ...result, sponsored };
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
