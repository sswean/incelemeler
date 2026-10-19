import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CategoryListQuery, type CategoryList } from '@incelemeler/contracts';
import { parseQuery } from '../common/zod-query.js';
import { CategoriesService } from './categories.service.js';

@Controller('v1/categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  async list(
    @Query() rawQuery: unknown,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CategoryList> {
    const query = parseQuery(CategoryListQuery, rawQuery);
    res.setHeader('Cache-Control', 'public, max-age=60');
    return this.categories.listPublished(query);
  }
}
