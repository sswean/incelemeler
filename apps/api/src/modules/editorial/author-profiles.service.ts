import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { AuthorProfile, AuthorProfileBody, PublicAuthor } from '@incelemeler/contracts';
import { ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthContext } from '../identity/auth.context.js';
import { AuditService } from '../platform/audit.service.js';

type Links = PublicAuthor['links'];

/** Yazar/editör profilleri (REQ-ICR-011): her personel kendi profilini yönetir; sayfa herkese açık. */
@Injectable()
export class AuthorProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  async own(ctx: AuthContext): Promise<AuthorProfile> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: ctx.userId },
      include: { authorProfile: true },
    });
    const p = user.authorProfile;
    return {
      displayName: user.displayName,
      profile: p
        ? {
            slug: p.slug,
            title: p.title,
            bio: p.bio,
            expertise: p.expertise,
            ethics: p.ethics,
            links: p.links as Links,
            version: p.version,
            updatedAt: p.updatedAt.toISOString(),
          }
        : null,
    };
  }

  async save(ctx: AuthContext, body: AuthorProfileBody, meta: RequestMeta): Promise<AuthorProfile> {
    const taken = await this.prisma.authorProfile.findUnique({
      where: { slug: body.slug },
      select: { userId: true },
    });
    if (taken && taken.userId !== ctx.userId) {
      throw new ProblemException(
        HttpStatus.CONFLICT,
        'CONFLICT',
        'Bu adres kullanılıyor',
        undefined,
        [
          {
            pointer: '/slug',
            code: 'slug_taken',
            message: 'Bu adres başka bir yazarda kullanılıyor',
          },
        ],
      );
    }
    const data = {
      slug: body.slug,
      title: body.title,
      bio: body.bio,
      expertise: body.expertise,
      ethics: body.ethics,
      links: body.links as Prisma.InputJsonArray,
    };
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.authorProfile.findUnique({ where: { userId: ctx.userId } });
      if (current) {
        if (body.version !== current.version) throw versionConflict();
        const res = await tx.authorProfile.updateMany({
          where: { userId: ctx.userId, version: current.version },
          data: { ...data, version: { increment: 1 } },
        });
        if (res.count === 0) throw versionConflict();
      } else {
        if (body.version !== undefined) throw versionConflict();
        await tx.authorProfile.create({ data: { userId: ctx.userId, ...data } });
      }
      await this.audit.record(
        {
          actorId: ctx.userId,
          actorRole: ctx.roles.join(','),
          action: current ? 'editorial.author_profile.updated' : 'editorial.author_profile.created',
          targetType: 'author_profile',
          targetId: ctx.userId,
          summary: { slug: body.slug },
          ipPrefix: meta.ipPrefix,
          traceId: meta.traceId,
        },
        tx,
      );
    });
    return this.own(ctx);
  }

  async publicBySlug(slug: string): Promise<PublicAuthor> {
    const p = await this.prisma.authorProfile.findUnique({
      where: { slug },
      include: { user: true },
    });
    if (!p || p.user.status !== 'ACTIVE') {
      throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Yazar bulunamadı');
    }
    const articles = await this.prisma.article.findMany({
      where: {
        authorId: p.userId,
        status: 'PUBLISHED',
        deletedAt: null,
        ...(this.env.APP_ENV === 'production' ? { dataOrigin: { not: 'DEMO' } } : {}),
      },
      select: { type: true, slug: true, title: true, summary: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 100,
    });
    return {
      displayName: p.user.displayName,
      slug: p.slug,
      title: p.title,
      bio: p.bio,
      expertise: p.expertise,
      ethics: p.ethics,
      links: p.links as Links,
      articles: articles.map((a) => ({ ...a, publishedAt: a.publishedAt?.toISOString() ?? null })),
    };
  }
}

const versionConflict = () =>
  new ProblemException(
    HttpStatus.PRECONDITION_FAILED,
    'PRECONDITION_FAILED',
    'Profil başka bir oturumda değiştirildi',
  );
