import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AdminAreaListQuery } from '@incelemeler/contracts';
import { parseQuery } from '../../common/zod-query.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Public } from '../identity/auth.context.js';

/** İdari bölgeler (REQ-VER-009): referans verisi, herkese açık. */
@Controller('v1/admin-areas')
export class AdminAreasController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  async list(@Query() raw: unknown, @Res({ passthrough: true }) res: Response) {
    const q = parseQuery(AdminAreaListQuery, raw);
    const rows = await this.prisma.adminArea.findMany({
      where: {
        ...(q.level ? { level: q.level } : {}),
        ...(q.parentId ? { parentId: q.parentId } : {}),
      },
      orderBy: [{ code: 'asc' }, { name: 'asc' }],
    });
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return {
      data: rows
        .sort((a, b) =>
          a.code && b.code ? a.code.localeCompare(b.code) : a.name.localeCompare(b.name, 'tr'),
        )
        .map((r) => ({
          id: r.id,
          level: r.level,
          name: r.name,
          slug: r.slug,
          code: r.code,
          parentId: r.parentId,
        })),
    };
  }
}
