import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import {
  type AdminArticle,
  type AdminArticleList,
  type AdminArticleListQuery,
  ArticleBody,
  type ArticleCreateBody,
  type ArticleStatus,
  type ArticleTransitionBody,
  type ArticleUpdateBody,
} from '@incelemeler/contracts';
import { slugifyTr } from '@incelemeler/utils';
import { decodeCursor, encodeCursor, InvalidCursorError } from '../../common/cursor.js';
import { type FieldError, ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import { signToken } from '../../common/signed-token.js';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { can } from '../access/permissions.js';
import type { AuthContext } from '../identity/auth.context.js';
import { toMediaDto } from '../media/media.service.js';
import { OutboxService } from '../outbox/outbox.service.js';
import { AuditService } from '../platform/audit.service.js';
import { articleBlockers, type Issue, referencedIds } from './article-rules.js';

type Tx = Prisma.TransactionClient;
const INCLUDE = { author: true, editor: true } satisfies Prisma.ArticleInclude;
type Row = Prisma.ArticleGetPayload<{ include: typeof INCLUDE }>;
export const PREVIEW_PURPOSE = 'article-preview';
const PREVIEW_TTL_MS = 24 * 60 * 60 * 1000;

/** İzinli geçişler (REQ-ICR-005). */
const TRANSITIONS: Record<ArticleStatus, ArticleStatus[]> = {
  DRAFT: ['IN_REVIEW'],
  IN_REVIEW: ['DRAFT', 'APPROVED'],
  APPROVED: ['DRAFT', 'SCHEDULED', 'PUBLISHED'],
  SCHEDULED: ['APPROVED', 'PUBLISHED'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: ['DRAFT'],
};

function invalid(errors: FieldError[], title = 'İçerik kuralları sağlanmadı') {
  return new ProblemException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'VALIDATION_FAILED',
    title,
    undefined,
    errors,
  );
}
const forbidden = (title: string) => new ProblemException(HttpStatus.FORBIDDEN, 'FORBIDDEN', title);
const versionConflict = () =>
  new ProblemException(
    HttpStatus.PRECONDITION_FAILED,
    'PRECONDITION_FAILED',
    'İçerik başka biri tarafından değiştirildi',
  );

/**
 * Editoryal içerik yönetimi (REQ-ICR-001…009, REQ-VER-015): yazar taslak yazar ve incelemeye gönderir;
 * editör onaylar, zamanlar, yayımlar. Sponsorlu içerikte onay yönetici ticari açıklama kontrolüdür.
 */
@Injectable()
export class AdminArticlesService {
  private readonly logger = new Logger('Articles');

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  async list(ctx: AuthContext, q: AdminArticleListQuery): Promise<AdminArticleList> {
    let after: { updatedAt: Date; id: string } | undefined;
    if (q.cursor) {
      try {
        const c = decodeCursor(q.cursor, this.env.CURSOR_SECRET);
        after = { updatedAt: new Date(String(c.k[0])), id: c.id };
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
    const rows = await this.prisma.article.findMany({
      where: {
        deletedAt: null,
        ...(q.type ? { type: q.type } : {}),
        ...(q.status ? { status: q.status } : {}),
        ...(q.mine || !this.isEditor(ctx) ? { authorId: ctx.userId } : {}),
        ...(after
          ? {
              OR: [
                { updatedAt: { lt: after.updatedAt } },
                { updatedAt: after.updatedAt, id: { lt: after.id } },
              ],
            }
          : {}),
      },
      include: { author: true },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: q.limit + 1,
    });
    const page = rows.slice(0, q.limit);
    const last = page.at(-1);
    return {
      data: page.map((a) => ({
        id: a.id,
        type: a.type,
        slug: a.slug,
        title: a.title,
        status: a.status,
        authorName: a.author.displayName,
        updatedAt: a.updatedAt.toISOString(),
      })),
      page: {
        hasMore: rows.length > q.limit,
        nextCursor:
          rows.length > q.limit && last
            ? encodeCursor(
                { k: [last.updatedAt.toISOString()], id: last.id },
                this.env.CURSOR_SECRET,
              )
            : null,
      },
    };
  }

  async get(ctx: AuthContext, id: string): Promise<AdminArticle> {
    const a = await this.load(id);
    this.assertCanRead(ctx, a);
    return this.toDto(a);
  }

  async create(
    ctx: AuthContext,
    body: ArticleCreateBody,
    meta: RequestMeta,
  ): Promise<AdminArticle> {
    if (
      body.type === 'SPONSORED' ? !can(ctx.roles, 'sponsored.content.write') : !this.canWrite(ctx)
    ) {
      throw forbidden('Bu türde içerik oluşturma yetkin yok');
    }
    const slug = body.slug ?? slugifyTr(body.title);
    await this.assertSlugFree(slug, null);
    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.article.create({
        data: {
          type: body.type,
          title: body.title,
          slug,
          authorId: ctx.userId,
          commercialRelation: body.type === 'SPONSORED' ? 'SPONSORED' : 'NONE',
        },
        include: INCLUDE,
      });
      await this.record(tx, ctx, 'editorial.article.create', created.id, meta, { type: body.type });
      return created;
    });
    return this.toDto(row);
  }

  async update(
    ctx: AuthContext,
    id: string,
    body: ArticleUpdateBody,
    meta: RequestMeta,
  ): Promise<AdminArticle> {
    const current = await this.load(id);
    this.assertCanEdit(ctx, current);
    if (current.version !== body.version) throw versionConflict();
    const published = current.status === 'PUBLISHED';
    if (published && !body.changeNote) {
      throw invalid([
        {
          pointer: '/changeNote',
          code: 'change_note_required',
          message: 'Değişiklik notu gerekli',
        },
      ]);
    }
    if (body.slug && body.slug !== current.slug) {
      if (current.publishedAt) {
        throw invalid([
          {
            pointer: '/slug',
            code: 'slug_locked',
            message: 'Yayımlanmış içeriğin adresi değişmez',
          },
        ]);
      }
      await this.assertSlugFree(body.slug, id);
    }
    const errors: FieldError[] = [];
    const type = current.type;
    if (body.commercialRelation === 'SPONSORED' && type !== 'SPONSORED') {
      errors.push({
        pointer: '/commercialRelation',
        code: 'sponsored_type_required',
        message: 'Sponsorlu içerik türü gerekli',
      });
    }
    if (
      type === 'SPONSORED' &&
      body.commercialRelation &&
      body.commercialRelation !== 'SPONSORED'
    ) {
      errors.push({
        pointer: '/commercialRelation',
        code: 'sponsored_relation_required',
        message: 'Sponsorlu içerikte ilişki sabit',
      });
    }
    if (errors.length) throw invalid(errors);

    const now = new Date();
    const significant = published && body.significantChange === true;
    const notes = current.updateNotes as Array<{ date: string; note: string }>;
    await this.prisma.$transaction(async (tx) => {
      await tx.contentRevision.create({
        data: {
          articleId: id,
          version: current.version,
          snapshot: snapshot(current),
          actorId: ctx.userId,
          changeNote: body.changeNote ?? null,
          significant,
        },
      });
      const res = await tx.article.updateMany({
        where: { id, version: body.version },
        data: {
          ...pick(body, [
            'title',
            'slug',
            'summary',
            'heroMediaId',
            'interestDeclared',
            'commercialRelation',
            'experienceType',
            'experienceNote',
            'selectionMethod',
          ]),
          ...(body.body !== undefined ? { body: body.body as Prisma.InputJsonArray } : {}),
          ...(body.sources !== undefined ? { sources: body.sources as Prisma.InputJsonArray } : {}),
          ...(significant
            ? {
                lastSignificantUpdateAt: now,
                updateNotes: [...notes, { date: now.toISOString(), note: body.changeNote! }],
              }
            : {}),
          version: { increment: 1 },
        },
      });
      if (res.count === 0) throw versionConflict();
      await this.record(tx, ctx, 'editorial.article.update', id, meta, {
        changed: Object.keys(body).filter((k) => k !== 'version'),
        significant,
      });
      if (published) {
        await this.outbox.enqueue(tx, {
          type: 'editorial.article.updated',
          aggregateType: 'article',
          aggregateId: id,
        });
      }
    });
    return this.toDto(await this.load(id));
  }

  async transition(
    ctx: AuthContext,
    id: string,
    body: ArticleTransitionBody,
    meta: RequestMeta,
  ): Promise<AdminArticle> {
    const a = await this.load(id);
    if (a.version !== body.version) throw versionConflict();
    const from = a.status;
    const to = body.to;
    if (!TRANSITIONS[from].includes(to)) {
      throw invalid([
        { pointer: '/to', code: 'transition_not_allowed', message: `${from} → ${to} geçişi yok` },
      ]);
    }
    const editor = this.isEditor(ctx);
    if (to === 'IN_REVIEW' || (from === 'IN_REVIEW' && to === 'DRAFT')) {
      this.assertCanEdit(ctx, a, true);
    } else if (!editor) {
      throw forbidden('Yazar yayımlayamaz; editör onayı gerekir');
    }
    if (
      to === 'APPROVED' &&
      from === 'IN_REVIEW' &&
      a.type === 'SPONSORED' &&
      !can(ctx.roles, 'campaigns.amount')
    ) {
      // Sponsorlu içerikte onay = yönetici ticari açıklama kontrolü (REQ-ICR-005, A-014).
      throw forbidden('Sponsorlu içerik onayı yönetici ticari açıklama kontrolü gerektirir');
    }
    if (to === 'IN_REVIEW' || to === 'APPROVED' || to === 'SCHEDULED' || to === 'PUBLISHED') {
      const blockers = await this.blockers(a);
      if (blockers.length) {
        throw invalid(
          blockers.map((b) => ({ ...b, message: 'Eksik' })),
          'İçerik kuralları sağlanmadı',
        );
      }
    }
    let scheduledAt: Date | null = null;
    if (to === 'SCHEDULED') {
      scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
      if (!scheduledAt || scheduledAt.getTime() <= Date.now()) {
        throw invalid([
          { pointer: '/scheduledAt', code: 'schedule_in_future', message: 'Gelecek bir zaman seç' },
        ]);
      }
    }
    await this.prisma.$transaction(async (tx) => {
      const res = await tx.article.updateMany({
        where: { id, version: body.version },
        data: {
          status: to,
          scheduledAt: to === 'SCHEDULED' ? scheduledAt : null,
          ...(to === 'APPROVED' && from === 'IN_REVIEW' ? { editorId: ctx.userId } : {}),
          ...(to === 'APPROVED' && a.type === 'SPONSORED'
            ? { disclosureCheckedById: ctx.userId }
            : {}),
          ...(to === 'PUBLISHED' && !a.publishedAt ? { publishedAt: new Date() } : {}),
          version: { increment: 1 },
        },
      });
      if (res.count === 0) throw versionConflict();
      await this.record(tx, ctx, 'editorial.article.status', id, meta, { from, to });
      if (to === 'PUBLISHED' || from === 'PUBLISHED') {
        await this.outbox.enqueue(tx, {
          type:
            to === 'PUBLISHED' ? 'editorial.article.published' : 'editorial.article.unpublished',
          aggregateType: 'article',
          aggregateId: id,
        });
      }
    });
    return this.toDto(await this.load(id));
  }

  /** Görünür düzeltme notu (REQ-ICR-009): yayındaki içeriğe eklenir, denetim kaydına girer. */
  async correct(
    ctx: AuthContext,
    id: string,
    version: number,
    note: string,
    meta: RequestMeta,
  ): Promise<AdminArticle> {
    if (!this.isEditor(ctx)) throw forbidden('Düzeltme notunu editör ekler');
    const a = await this.load(id);
    if (a.status !== 'PUBLISHED') {
      throw invalid([
        { pointer: '/', code: 'not_published', message: 'Yalnızca yayındaki içerik' },
      ]);
    }
    const corrections = a.corrections as Array<{ date: string; note: string }>;
    await this.prisma.$transaction(async (tx) => {
      const res = await tx.article.updateMany({
        where: { id, version },
        data: {
          corrections: [...corrections, { date: new Date().toISOString(), note }],
          version: { increment: 1 },
        },
      });
      if (res.count === 0) throw versionConflict();
      await this.record(tx, ctx, 'editorial.article.correction', id, meta, { note });
      await this.outbox.enqueue(tx, {
        type: 'editorial.article.updated',
        aggregateType: 'article',
        aggregateId: id,
      });
    });
    return this.toDto(await this.load(id));
  }

  /** İmzalı, süreli önizleme bağlantısı (noindex) — REQ-ICR-005. */
  async preview(ctx: AuthContext, id: string): Promise<{ url: string; expiresAt: string }> {
    const a = await this.load(id);
    this.assertCanRead(ctx, a);
    const { token, expiresAt } = signToken(
      { articleId: id },
      this.env.CURSOR_SECRET,
      PREVIEW_PURPOSE,
      PREVIEW_TTL_MS,
    );
    return {
      url: `${this.env.WEB_BASE_URL}/onizleme/${token}`,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /** Zamanı gelen içerikleri yayımlar (worker döngüsü; Europe/Istanbul arayüzde, UTC saklanır). */
  async publishDue(now = new Date()): Promise<number> {
    const due = await this.prisma.article.findMany({
      where: { status: 'SCHEDULED', scheduledAt: { lte: now }, deletedAt: null },
      include: INCLUDE,
    });
    let published = 0;
    for (const a of due) {
      if ((await this.blockers(a)).length) {
        this.logger.warn(JSON.stringify({ event: 'article.schedule_blocked', id: a.id }));
        continue;
      }
      await this.prisma.$transaction(async (tx) => {
        const res = await tx.article.updateMany({
          where: { id: a.id, status: 'SCHEDULED', version: a.version },
          data: {
            status: 'PUBLISHED',
            publishedAt: a.publishedAt ?? now,
            version: { increment: 1 },
          },
        });
        if (res.count === 0) return;
        published++;
        await this.audit.record(
          {
            actorId: null,
            actorRole: 'system',
            action: 'editorial.article.scheduled_publish',
            targetType: 'article',
            targetId: a.id,
          },
          tx,
        );
        await this.outbox.enqueue(tx, {
          type: 'editorial.article.published',
          aggregateType: 'article',
          aggregateId: a.id,
        });
      });
    }
    return published;
  }

  // ── Yardımcılar ──

  private isEditor(ctx: AuthContext) {
    return can(ctx.roles, 'content.publish');
  }
  private canWrite(ctx: AuthContext) {
    return can(ctx.roles, 'content.publish') || can(ctx.roles, 'content.draft');
  }
  private assertCanRead(ctx: AuthContext, a: Row) {
    if (!this.isEditor(ctx) && a.authorId !== ctx.userId) {
      throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'İçerik bulunamadı');
    }
  }
  /** Yazar yalnız kendi taslağını (ya da incelemeden geri aldığını) düzenler; editör hepsini. */
  private assertCanEdit(ctx: AuthContext, a: Row, forTransition = false) {
    this.assertCanRead(ctx, a);
    if (this.isEditor(ctx)) return;
    const ownable = forTransition ? ['DRAFT', 'IN_REVIEW'] : ['DRAFT'];
    if (a.authorId !== ctx.userId || !ownable.includes(a.status)) {
      throw forbidden('Yazar yalnızca kendi taslağını düzenleyebilir');
    }
  }

  private async assertSlugFree(slug: string, id: string | null) {
    const taken = await this.prisma.article.findUnique({ where: { slug }, select: { id: true } });
    if (taken && taken.id !== id) {
      throw new ProblemException(
        HttpStatus.CONFLICT,
        'CONFLICT',
        'Bu adres kullanılıyor',
        undefined,
        [
          {
            pointer: '/slug',
            code: 'slug_taken',
            message: 'Bu adres başka bir içerikte kullanılıyor',
          },
        ],
      );
    }
  }

  private async blockers(a: Row): Promise<Issue[]> {
    const body = ArticleBody.parse(a.body);
    const refs = referencedIds(body);
    const mediaIds = [...refs.mediaIds, ...(a.heroMediaId ? [a.heroMediaId] : [])];
    const [media, listings] = await Promise.all([
      this.prisma.mediaAsset.findMany({ where: { id: { in: mediaIds } } }),
      this.prisma.listing.findMany({
        where: { id: { in: refs.listingIds }, deletedAt: null },
        select: { id: true },
      }),
    ]);
    const found = new Set(listings.map((l) => l.id));
    return articleBlockers({
      type: a.type,
      title: a.title,
      body,
      interestDeclared: a.interestDeclared,
      commercialRelation: a.commercialRelation,
      experienceType: a.experienceType,
      selectionMethod: a.selectionMethod,
      media: [
        ...media.map((m) => {
          const d = toMediaDto(m);
          return { id: d.id, licenseComplete: d.licenseComplete, altText: d.altText };
        }),
        ...mediaIds
          .filter((mid) => !media.some((m) => m.id === mid))
          .map((mid) => ({ id: mid, licenseComplete: false, altText: null })),
      ],
      missingListingIds: refs.listingIds.filter((l) => !found.has(l)),
    });
  }

  private record(
    tx: Tx,
    ctx: AuthContext,
    action: string,
    targetId: string,
    meta: RequestMeta,
    summary: Prisma.InputJsonObject,
  ) {
    return this.audit.record(
      {
        actorId: ctx.userId,
        actorRole: ctx.roles.join(','),
        action,
        targetType: 'article',
        targetId,
        summary,
        ipPrefix: meta.ipPrefix,
        traceId: meta.traceId,
      },
      tx,
    );
  }

  private async load(id: string): Promise<Row> {
    const a = await this.prisma.article.findFirst({
      where: { id, deletedAt: null },
      include: INCLUDE,
    });
    if (!a) throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'İçerik bulunamadı');
    return a;
  }

  private async toDto(a: Row): Promise<AdminArticle> {
    return {
      id: a.id,
      type: a.type,
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      body: ArticleBody.parse(a.body),
      heroMediaId: a.heroMediaId,
      sources: a.sources as AdminArticle['sources'],
      status: a.status,
      interestDeclared: a.interestDeclared,
      commercialRelation: a.commercialRelation,
      experienceType: a.experienceType,
      experienceNote: a.experienceNote,
      selectionMethod: a.selectionMethod,
      author: { id: a.author.id, displayName: a.author.displayName },
      editor: a.editor ? { id: a.editor.id, displayName: a.editor.displayName } : null,
      scheduledAt: a.scheduledAt?.toISOString() ?? null,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      lastSignificantUpdateAt: a.lastSignificantUpdateAt?.toISOString() ?? null,
      updateNotes: a.updateNotes as AdminArticle['updateNotes'],
      corrections: a.corrections as AdminArticle['corrections'],
      updatedAt: a.updatedAt.toISOString(),
      version: a.version,
      blockers: await this.blockers(a),
    };
  }
}

function pick<T extends object, K extends keyof T>(o: T, keys: K[]): Partial<Pick<T, K>> {
  const out: Partial<Pick<T, K>> = {};
  for (const k of keys) if (o[k] !== undefined) out[k] = o[k];
  return out;
}

function snapshot(a: Row): Prisma.InputJsonObject {
  return {
    title: a.title,
    slug: a.slug,
    summary: a.summary,
    body: a.body as Prisma.InputJsonArray,
    heroMediaId: a.heroMediaId,
    sources: a.sources as Prisma.InputJsonArray,
    commercialRelation: a.commercialRelation,
    experienceType: a.experienceType,
    selectionMethod: a.selectionMethod,
    status: a.status,
  };
}
