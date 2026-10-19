import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type {
  AdminCategory,
  AdminCategoryList,
  AdminCategoryListQuery,
  CategoryCreateBody,
  CategoryUpdateBody,
  ListingKind,
} from '@incelemeler/contracts';
import { slugifyTr } from '@incelemeler/utils';
import { decodeCursor, encodeCursor, InvalidCursorError } from '../../common/cursor.js';
import { type FieldError, ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import type { Category, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthContext } from '../identity/auth.context.js';
import { OutboxService } from '../outbox/outbox.service.js';
import { AuditService } from '../platform/audit.service.js';

/** Kategori ağacı en fazla 3 seviye (Ek A4.1). */
export const MAX_DEPTH = 3;

const FLAG_KEYS = [
  'ymyl',
  'requiresExpertReview',
  'ugcEnabled',
  'sponsorshipAllowed',
  'requiresLicense',
] as const;
type Flags = Record<(typeof FLAG_KEYS)[number], boolean>;

function invalid(errors: FieldError[]): ProblemException {
  return new ProblemException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'VALIDATION_FAILED',
    'Kategori kuralları sağlanmadı',
    undefined,
    errors,
  );
}

/**
 * REQ-KAT-004: YMYL kategoride uzman incelemesi zorunlu; YMYL ve lisanslı kategoride sponsorluk kapalı
 * (açılması hukuki kapı gerektirir — A-011). Açıkça aykırı istek 422, belirtilmemişse güvenli varsayılan.
 */
function resolveFlags(current: Flags, input: Partial<Flags>): Flags {
  const next: Flags = { ...current, ...input };
  const errors: FieldError[] = [];
  if (next.ymyl) {
    if (input.requiresExpertReview === false) {
      errors.push({
        pointer: '/requiresExpertReview',
        code: 'ymyl_requires_expert_review',
        message: 'YMYL kategoride uzman incelemesi kapatılamaz',
      });
    }
    next.requiresExpertReview = true;
  }
  if (next.ymyl || next.requiresLicense) {
    if (input.sponsorshipAllowed === true) {
      errors.push({
        pointer: '/sponsorshipAllowed',
        code: 'sponsorship_restricted',
        message: 'YMYL ya da lisanslı kategoride sponsorluk açılamaz (hukuki kapı)',
      });
    }
    next.sponsorshipAllowed = false;
  }
  if (errors.length) throw invalid(errors);
  return next;
}

@Injectable()
export class AdminCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  /** Tüm kategoriler, derinlik öncelikli ağaç sırasıyla (kardeşler sortOrder, ad). */
  async list(query: AdminCategoryListQuery): Promise<AdminCategoryList> {
    let offset = 0;
    if (query.cursor) {
      try {
        offset = Number(decodeCursor(query.cursor, this.env.CURSOR_SECRET).k[0]);
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
    const rows = await this.prisma.category.findMany();
    const byParent = new Map<string | null, Category[]>();
    for (const r of rows) byParent.set(r.parentId, [...(byParent.get(r.parentId) ?? []), r]);
    const ordered: AdminCategory[] = [];
    const walk = (parentId: string | null, depth: number) => {
      const kids = (byParent.get(parentId) ?? []).sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'tr'),
      );
      for (const k of kids) {
        ordered.push(this.toDto(k, depth));
        walk(k.id, depth + 1);
      }
    };
    walk(null, 1);
    const page = ordered.slice(offset, offset + query.limit);
    const hasMore = offset + query.limit < ordered.length;
    return {
      data: page,
      page: {
        hasMore,
        nextCursor: hasMore
          ? encodeCursor({ k: [offset + query.limit], id: page.at(-1)!.id }, this.env.CURSOR_SECRET)
          : null,
      },
    };
  }

  async get(id: string): Promise<AdminCategory> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    if (!row) throw notFound();
    return this.toDto(row, await this.depthOf(row));
  }

  async create(
    ctx: AuthContext,
    body: CategoryCreateBody,
    meta: RequestMeta,
  ): Promise<AdminCategory> {
    const parent = body.parentId
      ? await this.prisma.category.findUnique({ where: { id: body.parentId } })
      : null;
    if (body.parentId && !parent) {
      throw invalid([{ pointer: '/parentId', code: 'not_found', message: 'Üst kategori yok' }]);
    }
    const depth = parent ? (await this.depthOf(parent)) + 1 : 1;
    const errors: FieldError[] = [];
    if (depth > MAX_DEPTH) {
      errors.push({
        pointer: '/parentId',
        code: 'depth_exceeded',
        message: `Kategori ağacı en fazla ${MAX_DEPTH} seviye olabilir`,
      });
    }
    const kinds = [...new Set(body.allowedKinds)];
    if (parent && kinds.some((k) => !parent.allowedKinds.includes(k))) {
      errors.push({
        pointer: '/allowedKinds',
        code: 'kinds_not_in_parent',
        message: 'Alt kategori yalnızca üst kategorinin izin verdiği türleri kullanabilir',
      });
    }
    if (errors.length) throw invalid(errors);

    const flags = resolveFlags(
      {
        ymyl: parent?.ymyl ?? false,
        requiresExpertReview: parent?.requiresExpertReview ?? false,
        ugcEnabled: parent?.ugcEnabled ?? true,
        sponsorshipAllowed: parent?.sponsorshipAllowed ?? true,
        requiresLicense: parent?.requiresLicense ?? false,
      },
      pickFlags(body),
    );
    const slug = body.slug ?? slugifyTr(body.name);
    await this.assertSlugFree(slug);

    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.category.create({
        data: {
          slug,
          name: body.name,
          parentId: parent?.id ?? null,
          allowedKinds: kinds,
          sortOrder: body.sortOrder ?? 0,
          ...flags,
          status: 'DRAFT',
          dataOrigin: 'EDITORIAL',
        },
      });
      await this.audit.record(
        {
          actorId: ctx.userId,
          actorRole: ctx.roles.join(','),
          action: 'taxonomy.category.create',
          targetType: 'category',
          targetId: created.id,
          summary: { after: snapshot(created) },
          ipPrefix: meta.ipPrefix,
          traceId: meta.traceId,
        },
        tx,
      );
      await this.outbox.enqueue(tx, {
        type: 'taxonomy.category.created',
        aggregateType: 'category',
        aggregateId: created.id,
      });
      return created;
    });
    return this.toDto(row, depth);
  }

  async update(
    ctx: AuthContext,
    id: string,
    body: CategoryUpdateBody,
    meta: RequestMeta,
  ): Promise<AdminCategory> {
    const current = await this.prisma.category.findUnique({ where: { id } });
    if (!current) throw notFound();
    if (current.version !== body.version) throw versionConflict();
    const parent = current.parentId
      ? await this.prisma.category.findUnique({ where: { id: current.parentId } })
      : null;
    const errors: FieldError[] = [];

    if (body.slug !== undefined && body.slug !== current.slug) {
      if (current.firstPublishedAt) {
        errors.push({
          pointer: '/slug',
          code: 'slug_locked',
          message: "Yayımlanmış kategorinin slug'ı değiştirilemez",
        });
      } else {
        await this.assertSlugFree(body.slug);
      }
    }

    let kinds = current.allowedKinds as ListingKind[];
    if (body.allowedKinds) {
      kinds = [...new Set(body.allowedKinds)];
      if (parent && kinds.some((k) => !parent.allowedKinds.includes(k))) {
        errors.push({
          pointer: '/allowedKinds',
          code: 'kinds_not_in_parent',
          message: 'Alt kategori yalnızca üst kategorinin izin verdiği türleri kullanabilir',
        });
      }
      const removed = current.allowedKinds.filter((k) => !kinds.includes(k));
      if (removed.length) {
        const [childUses, listingUses] = await Promise.all([
          this.prisma.category.count({
            where: { parentId: id, allowedKinds: { hasSome: removed } },
          }),
          this.prisma.listing.count({ where: { primaryCategoryId: id, kind: { in: removed } } }),
        ]);
        if (childUses + listingUses > 0) {
          errors.push({
            pointer: '/allowedKinds',
            code: 'kind_in_use',
            message: 'Kaldırılan tür alt kategorilerde ya da listelemelerde kullanılıyor',
          });
        }
      }
    }

    if (body.status === 'PUBLISHED' && current.status !== 'PUBLISHED') {
      if (parent && parent.status !== 'PUBLISHED') {
        errors.push({
          pointer: '/status',
          code: 'parent_not_published',
          message: 'Üst kategori yayında değilken alt kategori yayımlanamaz',
        });
      }
    }
    if (errors.length) throw invalid(errors);

    const flags = resolveFlags(pickFlags(current) as Flags, pickFlags(body));
    const publishing = body.status === 'PUBLISHED' && !current.firstPublishedAt;

    const row = await this.prisma.$transaction(async (tx) => {
      // Koşullu güncelleme: eşzamanlı yazımda sürüm tutmazsa 0 satır (REQ-MIM-011).
      const res = await tx.category.updateMany({
        where: { id, version: body.version },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.slug !== undefined ? { slug: body.slug } : {}),
          ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(publishing ? { firstPublishedAt: new Date() } : {}),
          allowedKinds: kinds,
          ...flags,
          version: { increment: 1 },
        },
      });
      if (res.count === 0) throw versionConflict();
      const updated = await tx.category.findUniqueOrThrow({ where: { id } });
      const changed = Object.keys(snapshot(updated)).filter(
        (k) => JSON.stringify(snapshot(updated)[k]) !== JSON.stringify(snapshot(current)[k]),
      );
      await this.audit.record(
        {
          actorId: ctx.userId,
          actorRole: ctx.roles.join(','),
          action: 'taxonomy.category.update',
          targetType: 'category',
          targetId: id,
          summary: { before: snapshot(current), after: snapshot(updated), changed },
          ipPrefix: meta.ipPrefix,
          traceId: meta.traceId,
        },
        tx,
      );
      await this.outbox.enqueue(tx, {
        type: 'taxonomy.category.updated',
        aggregateType: 'category',
        aggregateId: id,
        payload: { changed },
      });
      return updated;
    });
    return this.toDto(row, await this.depthOf(row));
  }

  private async assertSlugFree(slug: string): Promise<void> {
    if (await this.prisma.category.findUnique({ where: { slug }, select: { id: true } })) {
      throw new ProblemException(
        HttpStatus.CONFLICT,
        'CONFLICT',
        'Bu slug kullanılıyor',
        undefined,
        [
          {
            pointer: '/slug',
            code: 'slug_taken',
            message: 'Bu slug başka bir kategoride kullanılıyor',
          },
        ],
      );
    }
  }

  private async depthOf(row: Pick<Category, 'parentId'>): Promise<number> {
    let depth = 1;
    let parentId = row.parentId;
    while (parentId && depth <= MAX_DEPTH) {
      const p = await this.prisma.category.findUnique({
        where: { id: parentId },
        select: { parentId: true },
      });
      depth += 1;
      parentId = p?.parentId ?? null;
    }
    return depth;
  }

  private toDto(c: Category, depth: number): AdminCategory {
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      parentId: c.parentId,
      depth,
      allowedKinds: c.allowedKinds as ListingKind[],
      status: c.status,
      sortOrder: c.sortOrder,
      ymyl: c.ymyl,
      requiresExpertReview: c.requiresExpertReview,
      ugcEnabled: c.ugcEnabled,
      sponsorshipAllowed: c.sponsorshipAllowed,
      requiresLicense: c.requiresLicense,
      dataOrigin: c.dataOrigin,
      firstPublishedAt: c.firstPublishedAt?.toISOString() ?? null,
      updatedAt: c.updatedAt.toISOString(),
      version: c.version,
    };
  }
}

function pickFlags(src: Partial<Record<(typeof FLAG_KEYS)[number], boolean | undefined>>) {
  const out: Partial<Flags> = {};
  for (const k of FLAG_KEYS) if (src[k] !== undefined) out[k] = src[k];
  return out;
}

function snapshot(c: Category): Prisma.InputJsonObject {
  return {
    slug: c.slug,
    name: c.name,
    parentId: c.parentId,
    allowedKinds: c.allowedKinds,
    status: c.status,
    sortOrder: c.sortOrder,
    ...pickFlags(c),
  };
}

function notFound(): ProblemException {
  return new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Kategori bulunamadı');
}

function versionConflict(): ProblemException {
  return new ProblemException(
    HttpStatus.PRECONDITION_FAILED,
    'PRECONDITION_FAILED',
    'Kategori başka biri tarafından değiştirildi; sayfayı yenileyip yeniden dene',
  );
}
