import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { CategoryList, CategoryListQuery, ListingKind } from '@incelemeler/contracts';
import { ENV, type EnvToken } from '../config/env.provider.js';
import { decodeCursor, encodeCursor, InvalidCursorError } from '../common/cursor.js';
import { ProblemException } from '../common/problem.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  /**
   * Yayındaki kategoriler; sıralama (sortOrder, id) — cursor sayfalama (REQ-MIM-008).
   * Üretimde DEMO kayıtlar dönmez (§12.4).
   */
  async listPublished(query: CategoryListQuery): Promise<CategoryList> {
    let after: { sortOrder: number; id: string } | undefined;
    if (query.cursor) {
      try {
        const c = decodeCursor(query.cursor, this.env.CURSOR_SECRET);
        after = { sortOrder: Number(c.k[0]), id: c.id };
      } catch (e) {
        if (e instanceof InvalidCursorError) {
          throw new ProblemException(
            HttpStatus.BAD_REQUEST,
            'VALIDATION_FAILED',
            'Geçersiz cursor',
          );
        }
        throw e;
      }
    }
    const rows = await this.prisma.category.findMany({
      where: {
        status: 'PUBLISHED',
        ...(this.env.APP_ENV === 'production' ? { dataOrigin: { not: 'DEMO' } } : {}),
        ...(after
          ? {
              OR: [
                { sortOrder: { gt: after.sortOrder } },
                { sortOrder: after.sortOrder, id: { gt: after.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      take: query.limit + 1,
    });
    const hasMore = rows.length > query.limit;
    const page = rows.slice(0, query.limit);
    const last = page.at(-1);
    return {
      data: page.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        parentId: c.parentId,
        allowedKinds: c.allowedKinds as ListingKind[],
        sortOrder: c.sortOrder,
      })),
      page: {
        hasMore,
        nextCursor:
          hasMore && last
            ? encodeCursor({ k: [last.sortOrder], id: last.id }, this.env.CURSOR_SECRET)
            : null,
      },
    };
  }
}
