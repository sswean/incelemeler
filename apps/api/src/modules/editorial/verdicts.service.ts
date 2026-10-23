import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  AdminVerdict,
  AdminVerdictState,
  PublicVerdict,
  VerdictBody,
  VerdictCriterion,
} from '@incelemeler/contracts';
import { ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthContext } from '../identity/auth.context.js';
import { AuditService } from '../platform/audit.service.js';

const AUTHOR = { include: { authorProfile: true } } as const;
type VerdictRow = Prisma.EditorialVerdictGetPayload<{ include: { author: typeof AUTHOR } }>;

const unprocessable = (pointer: string, code: string, message: string) =>
  new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, 'VALIDATION_FAILED', message, undefined, [
    { pointer, code, message },
  ]);

/** Herkese açık editör değerlendirmesi (REQ-VER-005); kullanıcı puanıyla birleştirilmez (REQ-VER-004). */
export function publicVerdictDto(v: VerdictRow): PublicVerdict {
  return {
    version: v.version,
    experienceType: v.experienceType,
    experienceNote: v.experienceNote,
    testedAt: v.testedAt ? v.testedAt.toISOString().slice(0, 10) : null,
    score: v.score === null ? null : Number(v.score),
    criteria: v.criteria as VerdictCriterion[],
    pros: v.pros,
    cons: v.cons,
    summary: v.summary,
    author: { displayName: v.author.displayName, slug: v.author.authorProfile?.slug ?? null },
    publishedAt: v.publishedAt?.toISOString() ?? null,
    createdAt: v.createdAt.toISOString(),
  };
}
const adminDto = (v: VerdictRow): AdminVerdict => ({
  ...publicVerdictDto(v),
  id: v.id,
  articleId: v.articleId,
});

/** Yayımlanmış en son sürümü getiren Prisma ilişki seçimi (herkese açık listeleme sorgusu için). */
export const PUBLISHED_VERDICT = {
  where: { publishedAt: { not: null } },
  orderBy: { version: 'desc' },
  take: 1,
  include: { author: AUTHOR },
} as const satisfies Prisma.Listing$verdictsArgs;

/**
 * Editör değerlendirmeleri (REQ-VER-005): her kayıt yeni sürüm (öncekiler değişmez, veritabanı tetikleyicisi),
 * yayın ayrı adım. Satış/sponsorluk personeli izin gereği hiçbir sürümü göremez (REQ-GUN-012).
 */
@Injectable()
export class VerdictsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async state(listingId: string): Promise<AdminVerdictState> {
    await this.listingOrThrow(listingId);
    const rows = await this.prisma.editorialVerdict.findMany({
      where: { listingId },
      orderBy: { version: 'desc' },
      take: 20,
      include: { author: AUTHOR },
    });
    const current = rows.find((r) => r.isCurrent) ?? null;
    const published = rows.find((r) => r.publishedAt) ?? null;
    return {
      current: current ? adminDto(current) : null,
      published: published ? adminDto(published) : null,
      history: rows.map((r) => ({
        version: r.version,
        authorName: r.author.displayName,
        score: r.score === null ? null : Number(r.score),
        createdAt: r.createdAt.toISOString(),
        publishedAt: r.publishedAt?.toISOString() ?? null,
      })),
    };
  }

  async save(ctx: AuthContext, listingId: string, body: VerdictBody, meta: RequestMeta) {
    await this.listingOrThrow(listingId);
    if (body.articleId) {
      const a = await this.prisma.article.findUnique({ where: { id: body.articleId } });
      if (!a) throw unprocessable('/body/articleId', 'not_found', 'İçerik bulunamadı');
      // Sponsorlu içerikte editör puanı olmaz (REQ-SPN-007, Ç-13).
      if (a.type === 'SPONSORED' || a.commercialRelation === 'SPONSORED') {
        throw unprocessable(
          '/body/articleId',
          'sponsored_article',
          'Sponsorlu içeriğe editör değerlendirmesi bağlanamaz',
        );
      }
    }
    await this.prisma.$transaction(async (tx) => {
      // Aynı listelemeye eşzamanlı kayıtları sıraya koy.
      await tx.$queryRaw`SELECT id FROM listings WHERE id = ${listingId}::uuid FOR UPDATE`;
      const current = await tx.editorialVerdict.findFirst({
        where: { listingId, isCurrent: true },
        select: { id: true, version: true },
      });
      if ((current?.version ?? 0) !== body.baseVersion) {
        throw new ProblemException(
          HttpStatus.PRECONDITION_FAILED,
          'PRECONDITION_FAILED',
          'Değerlendirme başka biri tarafından güncellendi; sayfayı yenileyip yeniden dene',
        );
      }
      if (current) {
        await tx.editorialVerdict.update({ where: { id: current.id }, data: { isCurrent: false } });
      }
      const created = await tx.editorialVerdict.create({
        data: {
          listingId,
          articleId: body.articleId,
          version: body.baseVersion + 1,
          experienceType: body.experienceType,
          experienceNote: body.experienceNote,
          testedAt: body.testedAt ? new Date(`${body.testedAt}T00:00:00Z`) : null,
          score: body.score,
          criteria: body.criteria,
          pros: body.pros,
          cons: body.cons,
          summary: body.summary,
          authorId: ctx.userId,
        },
      });
      await this.audit.record(
        {
          actorId: ctx.userId,
          actorRole: ctx.roles.join(','),
          action: 'editorial.verdict.saved',
          targetType: 'listing',
          targetId: listingId,
          summary: { version: created.version, experienceType: body.experienceType },
          ipPrefix: meta.ipPrefix,
          traceId: meta.traceId,
        },
        tx,
      );
    });
    return this.state(listingId);
  }

  async publish(ctx: AuthContext, listingId: string, version: number, meta: RequestMeta) {
    await this.prisma.$transaction(async (tx) => {
      const v = await tx.editorialVerdict.findUnique({
        where: { listingId_version: { listingId, version } },
      });
      if (!v) throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Sürüm bulunamadı');
      if (!v.isCurrent || v.publishedAt) {
        throw new ProblemException(
          HttpStatus.CONFLICT,
          'CONFLICT',
          'Yalnızca yayımlanmamış güncel sürüm yayımlanabilir',
        );
      }
      await tx.editorialVerdict.update({
        where: { id: v.id },
        data: { publishedAt: new Date(), publishedById: ctx.userId },
      });
      await this.audit.record(
        {
          actorId: ctx.userId,
          actorRole: ctx.roles.join(','),
          action: 'editorial.verdict.published',
          targetType: 'listing',
          targetId: listingId,
          summary: { version },
          ipPrefix: meta.ipPrefix,
          traceId: meta.traceId,
        },
        tx,
      );
    });
    return this.state(listingId);
  }

  private async listingOrThrow(id: string) {
    const l = await this.prisma.listing.findUnique({ where: { id }, select: { id: true } });
    if (!l) throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Listeleme bulunamadı');
  }
}
