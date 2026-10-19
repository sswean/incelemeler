import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ArticleBody, type ListingCardData, type PublicArticle } from '@incelemeler/contracts';
import { ProblemException } from '../../common/problem.js';
import { verifyToken } from '../../common/signed-token.js';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { toMediaDto } from '../media/media.service.js';
import { PREVIEW_PURPOSE } from './admin-articles.service.js';
import { referencedIds } from './article-rules.js';

const INCLUDE = {
  author: { include: { authorProfile: true } },
  editor: true,
} satisfies Prisma.ArticleInclude;
type Row = Prisma.ArticleGetPayload<{ include: typeof INCLUDE }>;
const PUBLIC_LISTING = ['PUBLISHED', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY'];
const CAR_RENTAL_SLUG = 'arac-kiralama';

/** Herkese açık içerik okuma (REQ-ICR-003/006, REQ-SEO-001); üretimde DEMO dönmez (AK-03). */
@Injectable()
export class PublicArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  private demoFilter(): Prisma.ArticleWhereInput {
    return this.env.APP_ENV === 'production' ? { dataOrigin: { not: 'DEMO' } } : {};
  }

  async get(slug: string): Promise<PublicArticle> {
    const a = await this.prisma.article.findFirst({
      where: { slug, status: 'PUBLISHED', deletedAt: null, ...this.demoFilter() },
      include: INCLUDE,
    });
    if (!a) throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'İçerik bulunamadı');
    return this.toPublic(a);
  }

  /** İmzalı önizleme: her durumdaki içerik (yalnızca belirteçle; sayfa noindex). */
  async preview(token: string): Promise<PublicArticle> {
    const payload = verifyToken<{ articleId: string }>(
      token,
      this.env.CURSOR_SECRET,
      PREVIEW_PURPOSE,
    );
    if (!payload) {
      throw new ProblemException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'Önizleme bağlantısı geçersiz ya da süresi dolmuş',
      );
    }
    const a = await this.prisma.article.findFirst({
      where: { id: payload.articleId, deletedAt: null },
      include: INCLUDE,
    });
    if (!a) throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'İçerik bulunamadı');
    return this.toPublic(a);
  }

  async sitemap() {
    const rows = await this.prisma.article.findMany({
      where: { status: 'PUBLISHED', deletedAt: null, dataOrigin: { not: 'DEMO' } },
      select: { type: true, slug: true, publishedAt: true, lastSignificantUpdateAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 50_000,
    });
    return {
      data: rows.map((r) => ({
        type: r.type,
        slug: r.slug,
        lastmod: (r.lastSignificantUpdateAt ?? r.publishedAt ?? new Date()).toISOString(),
      })),
    };
  }

  private async toPublic(a: Row): Promise<PublicArticle> {
    const body = ArticleBody.parse(a.body);
    const refs = referencedIds(body);
    const mediaIds = [...refs.mediaIds, ...(a.heroMediaId ? [a.heroMediaId] : [])];
    const [mediaRows, listingRows] = await Promise.all([
      this.prisma.mediaAsset.findMany({ where: { id: { in: mediaIds } } }),
      this.prisma.listing.findMany({
        where: { id: { in: refs.listingIds } },
        include: {
          primaryCategory: { include: { parent: { include: { parent: true } } } },
          location: { include: { province: true, district: true } },
        },
      }),
    ]);
    const media: PublicArticle['media'] = {};
    for (const m of mediaRows) {
      const d = toMediaDto(m);
      if (d.status === 'READY' && d.licenseComplete && d.altText) {
        media[m.id] = {
          id: m.id,
          width: d.width,
          height: d.height,
          altText: d.altText,
          credit: d.rightsHolder!,
          blurhash: d.blurhash,
        };
      }
    }
    const listings: Record<string, ListingCardData> = {};
    for (const l of listingRows) {
      const c = l.primaryCategory;
      const visible =
        !l.deletedAt &&
        PUBLIC_LISTING.includes(l.status) &&
        (this.env.APP_ENV !== 'production' || l.dataOrigin !== 'DEMO');
      listings[l.id] = {
        id: l.id,
        kind: l.kind,
        slug: l.slug,
        name: l.name,
        status: l.status,
        carRental:
          l.kind === 'SERVICE_PROVIDER' &&
          [c.slug, c.parent?.slug, c.parent?.parent?.slug].includes(CAR_RENTAL_SLUG),
        categoryName: c.name,
        place: l.location
          ? [l.location.district?.name, l.location.province.name].filter(Boolean).join(', ')
          : null,
        priceLevel: l.priceLevel,
        reviewCount: 0,
        visible,
      };
    }
    return {
      id: a.id,
      type: a.type,
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      body,
      hero: a.heroMediaId ? (media[a.heroMediaId] ?? null) : null,
      sources: a.sources as PublicArticle['sources'],
      commercialRelation: a.commercialRelation,
      experienceType: a.experienceType,
      experienceNote: a.experienceNote,
      selectionMethod: a.selectionMethod,
      author: {
        displayName: a.author.displayName,
        slug: a.author.authorProfile?.slug ?? null,
      },
      editor: a.editor ? { displayName: a.editor.displayName } : null,
      status: a.status,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      lastSignificantUpdateAt: a.lastSignificantUpdateAt?.toISOString() ?? null,
      updateNotes: a.updateNotes as PublicArticle['updateNotes'],
      corrections: a.corrections as PublicArticle['corrections'],
      dataOrigin: a.dataOrigin,
      media,
      listings,
    };
  }
}
