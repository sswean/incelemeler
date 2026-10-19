import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  type AdminListing,
  type AdminListingList,
  type AdminListingListQuery,
  attributeValuesSchema,
  type DescriptionBlocks,
  type ListingContacts,
  type ListingCreateBody,
  type ListingDetailsInput,
  type ListingKind,
  type ListingMediaItem,
  type ListingStatus,
  type ListingStatusBody,
  type ListingUpdateBody,
} from '@incelemeler/contracts';
import type { z } from 'zod';
import { slugifyTr } from '@incelemeler/utils';
import { decodeCursor, encodeCursor, InvalidCursorError } from '../../common/cursor.js';
import { type FieldError, ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import type { Category, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { can } from '../access/permissions.js';
import type { AuthContext } from '../identity/auth.context.js';
import { OutboxService } from '../outbox/outbox.service.js';
import { AuditService } from '../platform/audit.service.js';
import { CategorySchemaService } from '../taxonomy/category-schema.service.js';
import { toMediaDto } from '../media/media.service.js';
import { type Issue, publishBlockers } from './publish-rules.js';

type Tx = Prisma.TransactionClient;
type DetailsKey = keyof ListingDetailsInput;

/** Tür uzantı tablosu eşlemesi (ADR-0004: 1:1 tür uzantıları). */
const DETAILS_KEY: Partial<Record<ListingKind, DetailsKey>> = {
  LODGING: 'lodging',
  PRODUCT: 'product',
  EXPERIENCE: 'experience',
  EVENT: 'event',
  GUIDE_PERSON: 'guide',
};

/** İzinli durum geçişleri. */
const TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  DRAFT: ['IN_REVIEW', 'PUBLISHED', 'ARCHIVED'],
  IN_REVIEW: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['DRAFT', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY', 'ARCHIVED'],
  CLOSED_TEMPORARILY: ['PUBLISHED', 'CLOSED_PERMANENTLY', 'ARCHIVED'],
  CLOSED_PERMANENTLY: ['PUBLISHED', 'ARCHIVED'],
  ARCHIVED: ['DRAFT'],
};
/** Yazarın (yalnız `listings.draft`) yapabildiği geçişler. */
const AUTHOR_TRANSITIONS = new Set<ListingStatus>(['DRAFT', 'IN_REVIEW']);

const INCLUDE = {
  primaryCategory: true,
  secondaryCategories: true,
  location: { include: { province: true, district: true } },
  serviceAreas: true,
  lodging: true,
  product: true,
  experience: true,
  event: true,
  guide: true,
} satisfies Prisma.ListingInclude;
const MEDIA_ENTITY = 'listing';
type ListingRow = Prisma.ListingGetPayload<{ include: typeof INCLUDE }>;

function invalid(errors: FieldError[], title = 'Listeleme kuralları sağlanmadı'): ProblemException {
  return new ProblemException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'VALIDATION_FAILED',
    title,
    undefined,
    errors,
  );
}
const fe = (pointer: string, code: string, message: string): FieldError => ({
  pointer,
  code,
  message,
});

/** Yazım için birleştirilmiş durum (oluşturma ya da güncelleme sonrası hâl). */
interface Draft {
  kind: ListingKind;
  dataOrigin: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: z.infer<typeof DescriptionBlocks> | null;
  primaryCategoryId: string;
  secondaryCategoryIds: string[];
  organizationId: string | null;
  priceLevel: number | null;
  attributes: Record<string, unknown>;
  contacts: ListingContacts;
  location: ListingCreateBody['location'] | null;
  serviceAreaProvinceIds: string[];
  details: ListingDetailsInput;
  media: ListingMediaItem[];
  source: string;
  sourceVerifiedAt: string | null;
}

/**
 * Listeleme yönetimi (REQ-LST-001, REQ-VER-001…003, 009, 013; REQ-KAT-004 hukuki kapı).
 * Yayın kuralları `publish-rules.ts`'te saf fonksiyon olarak test edilir.
 */
@Injectable()
export class AdminListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
    private readonly schemas: CategorySchemaService,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  async list(q: AdminListingListQuery): Promise<AdminListingList> {
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
    const rows = await this.prisma.listing.findMany({
      where: {
        deletedAt: null,
        ...(q.kind ? { kind: q.kind } : {}),
        ...(q.status ? { status: q.status } : {}),
        ...(q.categoryId ? { primaryCategoryId: q.categoryId } : {}),
        ...(q.q ? { name: { contains: q.q, mode: 'insensitive' as const } } : {}),
        ...(after
          ? {
              OR: [
                { updatedAt: { lt: after.updatedAt } },
                { updatedAt: after.updatedAt, id: { lt: after.id } },
              ],
            }
          : {}),
      },
      include: { primaryCategory: true, location: { include: { province: true } } },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: q.limit + 1,
    });
    const hasMore = rows.length > q.limit;
    const page = rows.slice(0, q.limit);
    const last = page.at(-1);
    return {
      data: page.map((l) => ({
        id: l.id,
        kind: l.kind,
        slug: l.slug,
        name: l.name,
        status: l.status,
        primaryCategoryName: l.primaryCategory.name,
        provinceName: l.location?.province.name ?? null,
        dataOrigin: l.dataOrigin,
        updatedAt: l.updatedAt.toISOString(),
      })),
      page: {
        hasMore,
        nextCursor:
          hasMore && last
            ? encodeCursor(
                { k: [last.updatedAt.toISOString()], id: last.id },
                this.env.CURSOR_SECRET,
              )
            : null,
      },
    };
  }

  async get(id: string): Promise<AdminListing> {
    return this.toDto(await this.load(id));
  }

  async create(
    ctx: AuthContext,
    body: ListingCreateBody,
    meta: RequestMeta,
  ): Promise<AdminListing> {
    const draft: Draft = {
      kind: body.kind,
      dataOrigin: body.dataOrigin,
      name: body.name,
      slug: body.slug ?? slugifyTr(body.name),
      shortDescription: body.shortDescription ?? null,
      description: body.description ?? null,
      primaryCategoryId: body.primaryCategoryId,
      secondaryCategoryIds: body.secondaryCategoryIds ?? [],
      organizationId: body.organizationId ?? null,
      priceLevel: body.priceLevel ?? null,
      attributes: body.attributes ?? {},
      contacts: body.contacts ?? {},
      location: body.location ?? null,
      serviceAreaProvinceIds: body.serviceAreaProvinceIds ?? [],
      details: body.details ?? {},
      media: body.media ?? [],
      source: body.source,
      sourceVerifiedAt: body.sourceVerifiedAt ?? null,
    };
    const { attributes, schemaVersion } = await this.validate(draft);
    await this.assertSlugFree(draft.slug, null);

    const id = await this.prisma.$transaction(async (tx) => {
      const row = await tx.listing.create({
        data: {
          kind: draft.kind,
          dataOrigin: draft.dataOrigin as 'EDITORIAL' | 'DEMO',
          status: 'DRAFT',
          ...this.columns(draft, attributes, schemaVersion),
        },
      });
      await this.writeRelations(tx, row.id, draft, true);
      await this.record(tx, ctx, 'catalog.listing.create', row.id, meta, {
        kind: draft.kind,
        slug: draft.slug,
      });
      await this.outbox.enqueue(tx, {
        type: 'catalog.listing.created',
        aggregateType: 'listing',
        aggregateId: row.id,
      });
      return row.id;
    });
    return this.get(id);
  }

  async update(
    ctx: AuthContext,
    id: string,
    body: ListingUpdateBody,
    meta: RequestMeta,
  ): Promise<AdminListing> {
    const current = await this.load(id);
    if (current.version !== body.version) throw versionConflict();
    this.assertAuthorMayEdit(ctx, current.status);
    const before = {
      ...this.toDraft(current),
      media: (await this.mediaOf(id)).map((m) => ({ mediaId: m.mediaId, role: m.role })),
    };
    const draft: Draft = {
      ...before,
      ...stripUndefined({
        name: body.name,
        slug: body.slug,
        shortDescription: body.shortDescription,
        description: body.description,
        primaryCategoryId: body.primaryCategoryId,
        secondaryCategoryIds: body.secondaryCategoryIds,
        organizationId: body.organizationId,
        priceLevel: body.priceLevel,
        attributes: body.attributes,
        contacts: body.contacts,
        location: body.location,
        serviceAreaProvinceIds: body.serviceAreaProvinceIds,
        details: body.details,
        media: body.media,
        source: body.source,
        sourceVerifiedAt: body.sourceVerifiedAt,
      }),
    };
    const { attributes, schemaVersion } = await this.validate(draft);
    if (draft.slug !== current.slug) await this.assertSlugFree(draft.slug, id);

    await this.prisma.$transaction(async (tx) => {
      const res = await tx.listing.updateMany({
        where: { id, version: body.version },
        data: { ...this.columns(draft, attributes, schemaVersion), version: { increment: 1 } },
      });
      if (res.count === 0) throw versionConflict();
      await this.writeRelations(tx, id, draft, false, body);
      if (draft.slug !== current.slug) {
        // REQ-VER-013: yayımlanmış adres kalıcı 301 için saklanır; geri dönülen slug geçmişten çıkar.
        await tx.slugHistory.deleteMany({ where: { entityType: 'listing', slug: draft.slug } });
        if (current.publishedAt) {
          await tx.slugHistory.create({
            data: { entityType: 'listing', entityId: id, slug: current.slug },
          });
        }
      }
      const changed = Object.keys(body).filter((k) => k !== 'version');
      await this.record(tx, ctx, 'catalog.listing.update', id, meta, {
        changed,
        ...(draft.slug !== current.slug
          ? { slug: { before: current.slug, after: draft.slug } }
          : {}),
      });
      await this.outbox.enqueue(tx, {
        type: 'catalog.listing.updated',
        aggregateType: 'listing',
        aggregateId: id,
        payload: { changed },
      });
    });
    return this.get(id);
  }

  async setStatus(
    ctx: AuthContext,
    id: string,
    body: ListingStatusBody,
    meta: RequestMeta,
  ): Promise<AdminListing> {
    const current = await this.load(id);
    if (current.version !== body.version) throw versionConflict();
    const from = current.status;
    const to = body.status;
    if (from === to) return this.toDto(current);
    if (!TRANSITIONS[from].includes(to)) {
      throw invalid([fe('/status', 'transition_not_allowed', `${from} → ${to} geçişi yok`)]);
    }
    if (!can(ctx.roles, 'listings.write') && !AUTHOR_TRANSITIONS.has(to)) {
      throw new ProblemException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'Yayın yetkin yok');
    }
    if (to === 'PUBLISHED') {
      const blockers = await this.blockers(current);
      if (blockers.length) {
        throw invalid(
          blockers.map((b) => fe(b.pointer, b.code, 'Yayın için eksik')),
          'Yayın için zorunlu alanlar eksik',
        );
      }
    }
    await this.prisma.$transaction(async (tx) => {
      const res = await tx.listing.updateMany({
        where: { id, version: body.version },
        data: {
          status: to,
          ...(to === 'PUBLISHED' && !current.publishedAt ? { publishedAt: new Date() } : {}),
          version: { increment: 1 },
        },
      });
      if (res.count === 0) throw versionConflict();
      await this.record(tx, ctx, 'catalog.listing.status', id, meta, { from, to });
      await this.outbox.enqueue(tx, {
        type: 'catalog.listing.status_changed',
        aggregateType: 'listing',
        aggregateId: id,
        payload: { from, to },
      });
    });
    return this.get(id);
  }

  // ── Doğrulama ──

  /** Yazım öncesi tüm sınır doğrulamaları; geçerli özellikler ve şema sürümünü döner. */
  private async validate(
    d: Draft,
  ): Promise<{ attributes: Record<string, unknown>; schemaVersion: number }> {
    const errors: FieldError[] = [];
    if (d.dataOrigin === 'DEMO') {
      if (this.env.APP_ENV === 'production') {
        errors.push(fe('/dataOrigin', 'demo_in_production', 'Üretimde demo veri oluşturulamaz'));
      }
      if (!d.name.endsWith('(Demo)')) {
        errors.push(fe('/name', 'demo_label_required', 'Demo listelemenin adı "(Demo)" ile biter'));
      }
    }

    const category = await this.prisma.category.findUnique({ where: { id: d.primaryCategoryId } });
    if (!category) {
      throw invalid([fe('/primaryCategoryId', 'not_found', 'Kategori bulunamadı')]);
    }
    if (!category.allowedKinds.includes(d.kind)) {
      errors.push(fe('/primaryCategoryId', 'kind_not_allowed', 'Kategori bu türe izin vermiyor'));
    }
    const secondary = [...new Set(d.secondaryCategoryIds)];
    if (secondary.includes(d.primaryCategoryId)) {
      errors.push(
        fe('/secondaryCategoryIds', 'duplicates_primary', 'Birincil kategori tekrar edilemez'),
      );
    }
    if (secondary.length) {
      const rows = await this.prisma.category.findMany({ where: { id: { in: secondary } } });
      if (rows.length !== secondary.length || rows.some((c) => !c.allowedKinds.includes(d.kind))) {
        errors.push(
          fe(
            '/secondaryCategoryIds',
            'kind_not_allowed',
            'İkincil kategoriler bu türe izin vermeli',
          ),
        );
      }
    }
    if (d.organizationId) {
      const org = await this.prisma.organization.findUnique({ where: { id: d.organizationId } });
      if (!org) errors.push(fe('/organizationId', 'not_found', 'Kuruluş bulunamadı'));
    }
    if (d.location) {
      const province = await this.prisma.adminArea.findUnique({
        where: { id: d.location.provinceId },
      });
      if (province?.level !== 'PROVINCE') {
        errors.push(fe('/location/provinceId', 'not_found', 'İl bulunamadı'));
      } else if (d.location.districtId) {
        const district = await this.prisma.adminArea.findUnique({
          where: { id: d.location.districtId },
        });
        if (district?.parentId !== province.id) {
          errors.push(fe('/location/districtId', 'district_mismatch', 'İlçe bu ile ait değil'));
        }
      }
    }
    if (d.serviceAreaProvinceIds.length) {
      const ids = [...new Set(d.serviceAreaProvinceIds)];
      const n = await this.prisma.adminArea.count({
        where: { id: { in: ids }, level: 'PROVINCE' },
      });
      if (n !== ids.length) {
        errors.push(fe('/serviceAreaProvinceIds', 'not_found', 'Hizmet bölgesi ili bulunamadı'));
      }
    }
    const allowedDetail = DETAILS_KEY[d.kind];
    for (const key of Object.keys(d.details) as DetailsKey[]) {
      if (key !== allowedDetail) {
        errors.push(fe(`/details/${key}`, 'details_kind_mismatch', 'Bu tür için geçerli değil'));
      }
    }
    const venueId = d.details.event?.venueListingId;
    if (venueId) {
      const venue = await this.prisma.listing.findUnique({ where: { id: venueId } });
      if (venue?.kind !== 'PLACE' || venue.deletedAt) {
        errors.push(
          fe('/details/event/venueListingId', 'venue_invalid', 'Mekan listelemesi değil'),
        );
      }
    }

    if (d.media.length) {
      const ids = d.media.map((m) => m.mediaId);
      if (new Set(ids).size !== ids.length) {
        errors.push(fe('/media', 'media_duplicate', 'Aynı görsel iki kez eklenemez'));
      }
      if (d.media.filter((m) => m.role === 'PRIMARY').length > 1) {
        errors.push(fe('/media', 'media_primary_multiple', 'En fazla bir kapak görseli olur'));
      }
      const found = await this.prisma.mediaAsset.count({
        where: { id: { in: ids }, status: 'READY' },
      });
      if (found !== new Set(ids).size) {
        errors.push(fe('/media', 'not_found', 'Görsel bulunamadı'));
      }
    }

    // REQ-VER-003: özellikler kategorinin etkin şemasına karşı (zorunluluk yayında denetlenir).
    const schema = await this.schemas.effective(d.primaryCategoryId);
    const parsed = attributeValuesSchema(
      schema.definitions.map((def) => ({ ...def, required: false })),
    ).safeParse(d.attributes);
    let attributes: Record<string, unknown> = {};
    if (parsed.success) {
      attributes = Object.fromEntries(
        Object.entries(parsed.data).filter(([, v]) => v !== undefined),
      );
    } else {
      for (const issue of parsed.error.issues) {
        const key =
          issue.code === 'unrecognized_keys' ? issue.keys[0] : String(issue.path[0] ?? '');
        errors.push(
          fe(
            `/attributes/${key}`,
            issue.code === 'unrecognized_keys' ? 'attribute_unknown' : 'attribute_invalid',
            issue.message,
          ),
        );
      }
    }
    if (errors.length) throw invalid(errors);
    return { attributes, schemaVersion: schema.schemaVersion };
  }

  private async assertSlugFree(slug: string, listingId: string | null): Promise<void> {
    const [taken, history] = await Promise.all([
      this.prisma.listing.findUnique({ where: { slug }, select: { id: true } }),
      this.prisma.slugHistory.findUnique({
        where: { entityType_slug: { entityType: 'listing', slug } },
      }),
    ]);
    if ((taken && taken.id !== listingId) || (history && history.entityId !== listingId)) {
      throw new ProblemException(
        HttpStatus.CONFLICT,
        'CONFLICT',
        'Bu slug kullanılıyor',
        undefined,
        [fe('/slug', 'slug_taken', 'Bu adres başka bir listelemede kullanılıyor')],
      );
    }
  }

  private assertAuthorMayEdit(ctx: AuthContext, status: ListingStatus): void {
    if (!can(ctx.roles, 'listings.write') && !AUTHOR_TRANSITIONS.has(status)) {
      throw new ProblemException(
        HttpStatus.FORBIDDEN,
        'FORBIDDEN',
        'Yazar yalnızca taslak listelemeleri düzenleyebilir',
      );
    }
  }

  /** Hukuki kapı (REQ-KAT-004): kategori zincirinde lisanslı/YMYL varsa geçerli onay gerekir. */
  private async legal(chain: Category[], dataOrigin: string) {
    const restricted = chain.filter((c) => c.requiresLicense || c.ymyl);
    if (!restricted.length) return { required: false, approved: false };
    const approvals = await this.prisma.legalApproval.findMany({
      where: { categoryId: { in: chain.map((c) => c.id) }, revokedAt: null },
    });
    const approved = approvals.some(
      (a) =>
        a.approvedBy !== 'TEST-FIXTURE' ||
        // Test fikstürü yalnızca üretim dışında ve yalnızca DEMO listelemelerde geçerlidir.
        (this.env.APP_ENV !== 'production' && dataOrigin === 'DEMO'),
    );
    return { required: true, approved };
  }

  private async blockers(l: ListingRow): Promise<Issue[]> {
    const schema = await this.schemas.effective(l.primaryCategoryId);
    const d = this.toDraft(l);
    return publishBlockers({
      kind: l.kind,
      shortDescription: l.shortDescription,
      categoryPublished: l.primaryCategory.status === 'PUBLISHED',
      dataOrigin: l.dataOrigin,
      appEnv: this.env.APP_ENV,
      contacts: d.contacts,
      location: l.location
        ? {
            districtId: l.location.districtId,
            latitude: l.location.latitude === null ? null : Number(l.location.latitude),
            longitude: l.location.longitude === null ? null : Number(l.location.longitude),
          }
        : null,
      serviceAreaCount: l.serviceAreas.length,
      organizationId: l.organizationId,
      attributes: d.attributes,
      attributeDefs: schema.definitions,
      details: d.details,
      legal: await this.legal(schema.chain, l.dataOrigin),
      media: await this.mediaOf(l.id),
    });
  }

  private async mediaOf(listingId: string) {
    const rows = await this.prisma.mediaUsage.findMany({
      where: { entityType: MEDIA_ENTITY, entityId: listingId },
      include: { media: true },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((u) => {
      const m = toMediaDto(u.media);
      return {
        mediaId: m.id,
        role: u.role as ListingMediaItem['role'],
        width: m.width,
        height: m.height,
        blurhash: m.blurhash,
        altText: m.altText,
        licenseComplete: m.licenseComplete,
      };
    });
  }

  // ── Yazım yardımcıları ──

  private columns(d: Draft, attributes: Record<string, unknown>, schemaVersion: number) {
    return {
      name: d.name,
      slug: d.slug,
      shortDescription: d.shortDescription,
      description: (d.description ?? undefined) as Prisma.InputJsonValue | undefined,
      primaryCategoryId: d.primaryCategoryId,
      organizationId: d.organizationId,
      priceLevel: d.priceLevel,
      attributes: attributes as Prisma.InputJsonObject,
      attributeSchemaVersion: schemaVersion,
      contacts: d.contacts as Prisma.InputJsonObject,
      source: d.source,
      sourceVerifiedAt: d.sourceVerifiedAt ? new Date(d.sourceVerifiedAt) : null,
    };
  }

  /** İlişkiler: yalnızca gövdede gelen bölümler yeniden yazılır (oluşturmada hepsi). */
  private async writeRelations(
    tx: Tx,
    id: string,
    d: Draft,
    all: boolean,
    body?: ListingUpdateBody,
  ): Promise<void> {
    if (all || body?.secondaryCategoryIds !== undefined) {
      await tx.listingCategory.deleteMany({ where: { listingId: id } });
      if (d.secondaryCategoryIds.length) {
        await tx.listingCategory.createMany({
          data: [...new Set(d.secondaryCategoryIds)].map((categoryId) => ({
            listingId: id,
            categoryId,
          })),
        });
      }
    }
    if (all || body?.location !== undefined) {
      await tx.listingLocation.deleteMany({ where: { listingId: id } });
      if (d.location) {
        await tx.listingLocation.create({
          data: {
            listingId: id,
            provinceId: d.location.provinceId,
            districtId: d.location.districtId ?? null,
            neighborhood: d.location.neighborhood ?? null,
            addressLine: d.location.addressLine ?? null,
            postalCode: d.location.postalCode ?? null,
            latitude: d.location.latitude ?? null,
            longitude: d.location.longitude ?? null,
          },
        });
      }
    }
    if (all || body?.serviceAreaProvinceIds !== undefined) {
      await tx.listingServiceArea.deleteMany({ where: { listingId: id } });
      if (d.serviceAreaProvinceIds.length) {
        await tx.listingServiceArea.createMany({
          data: [...new Set(d.serviceAreaProvinceIds)].map((provinceId) => ({
            listingId: id,
            provinceId,
          })),
        });
      }
    }
    if (all || body?.media !== undefined) {
      await tx.mediaUsage.deleteMany({ where: { entityType: MEDIA_ENTITY, entityId: id } });
      if (d.media.length) {
        await tx.mediaUsage.createMany({
          data: d.media.map((m, i) => ({
            mediaId: m.mediaId,
            entityType: MEDIA_ENTITY,
            entityId: id,
            role: m.role,
            sortOrder: i,
          })),
        });
      }
    }
    if (all || body?.details !== undefined) {
      const x = d.details;
      if (x.lodging) {
        const data = {
          tourismLicenseNo: x.lodging.tourismLicenseNo ?? null,
          licenseVerifiedAt: dateOrNull(x.lodging.licenseVerifiedAt),
          checkInTime: x.lodging.checkInTime ?? null,
          checkOutTime: x.lodging.checkOutTime ?? null,
        };
        await tx.listingLodging.upsert({
          where: { listingId: id },
          create: { listingId: id, ...data },
          update: data,
        });
      }
      if (x.product) {
        const data = {
          brand: x.product.brand,
          model: x.product.model,
          gtin: x.product.gtin ?? null,
          releaseDate: x.product.releaseDate ? new Date(x.product.releaseDate) : null,
        };
        await tx.listingProduct.upsert({
          where: { listingId: id },
          create: { listingId: id, ...data },
          update: data,
        });
      }
      if (x.experience) {
        const data = {
          durationMinutes: x.experience.durationMinutes ?? null,
          startPoint: x.experience.startPoint ?? null,
        };
        await tx.listingExperience.upsert({
          where: { listingId: id },
          create: { listingId: id, ...data },
          update: data,
        });
      }
      if (x.event) {
        const data = {
          startsAt: dateOrNull(x.event.startsAt),
          endsAt: dateOrNull(x.event.endsAt),
          venueListingId: x.event.venueListingId ?? null,
        };
        await tx.listingEvent.upsert({
          where: { listingId: id },
          create: { listingId: id, ...data },
          update: data,
        });
      }
      if (x.guide) {
        const data = {
          languages: x.guide.languages ?? [],
          licenseVerifiedAt: dateOrNull(x.guide.licenseVerifiedAt),
          consentAt: dateOrNull(x.guide.consentAt),
        };
        await tx.listingGuide.upsert({
          where: { listingId: id },
          create: { listingId: id, ...data },
          update: data,
        });
      }
    }
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
        targetType: 'listing',
        targetId,
        summary,
        ipPrefix: meta.ipPrefix,
        traceId: meta.traceId,
      },
      tx,
    );
  }

  // ── Okuma ──

  private async load(id: string): Promise<ListingRow> {
    const row = await this.prisma.listing.findFirst({
      where: { id, deletedAt: null },
      include: INCLUDE,
    });
    if (!row) throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Listeleme bulunamadı');
    return row;
  }

  private toDraft(l: ListingRow): Draft {
    const loc = l.location;
    return {
      kind: l.kind,
      dataOrigin: l.dataOrigin,
      name: l.name,
      slug: l.slug,
      shortDescription: l.shortDescription,
      description: (l.description as Draft['description']) ?? null,
      primaryCategoryId: l.primaryCategoryId,
      secondaryCategoryIds: l.secondaryCategories.map((c) => c.categoryId),
      organizationId: l.organizationId,
      priceLevel: l.priceLevel,
      attributes: l.attributes as Record<string, unknown>,
      contacts: l.contacts as ListingContacts,
      location: loc
        ? {
            provinceId: loc.provinceId,
            districtId: loc.districtId,
            neighborhood: loc.neighborhood,
            addressLine: loc.addressLine,
            postalCode: loc.postalCode,
            latitude: loc.latitude === null ? null : Number(loc.latitude),
            longitude: loc.longitude === null ? null : Number(loc.longitude),
          }
        : null,
      serviceAreaProvinceIds: l.serviceAreas.map((s) => s.provinceId),
      details: detailsOf(l),
      media: [],
      source: l.source,
      sourceVerifiedAt: l.sourceVerifiedAt?.toISOString() ?? null,
    };
  }

  private async toDto(l: ListingRow): Promise<AdminListing> {
    const d = this.toDraft(l);
    return {
      id: l.id,
      kind: l.kind,
      slug: l.slug,
      name: l.name,
      shortDescription: l.shortDescription,
      description: d.description,
      primaryCategory: {
        id: l.primaryCategory.id,
        name: l.primaryCategory.name,
        slug: l.primaryCategory.slug,
      },
      secondaryCategoryIds: d.secondaryCategoryIds,
      organizationId: l.organizationId,
      status: l.status,
      priceLevel: l.priceLevel,
      attributes: d.attributes,
      attributeSchemaVersion: l.attributeSchemaVersion,
      contacts: d.contacts,
      location: l.location
        ? {
            provinceId: l.location.provinceId,
            provinceName: l.location.province.name,
            districtId: l.location.districtId,
            districtName: l.location.district?.name ?? null,
            neighborhood: l.location.neighborhood,
            addressLine: l.location.addressLine,
            postalCode: l.location.postalCode,
            latitude: d.location?.latitude ?? null,
            longitude: d.location?.longitude ?? null,
          }
        : null,
      serviceAreaProvinceIds: d.serviceAreaProvinceIds,
      details: d.details,
      media: await this.mediaOf(l.id),
      dataOrigin: l.dataOrigin,
      source: l.source,
      sourceVerifiedAt: d.sourceVerifiedAt,
      publishedAt: l.publishedAt?.toISOString() ?? null,
      updatedAt: l.updatedAt.toISOString(),
      version: l.version,
      publishBlockers: await this.blockers(l),
    };
  }
}

function detailsOf(l: ListingRow): ListingDetailsInput {
  const iso = (d: Date | null) => d?.toISOString() ?? null;
  return {
    ...(l.lodging
      ? {
          lodging: {
            tourismLicenseNo: l.lodging.tourismLicenseNo,
            licenseVerifiedAt: iso(l.lodging.licenseVerifiedAt),
            checkInTime: l.lodging.checkInTime,
            checkOutTime: l.lodging.checkOutTime,
          },
        }
      : {}),
    ...(l.product
      ? {
          product: {
            brand: l.product.brand,
            model: l.product.model,
            gtin: l.product.gtin,
            releaseDate: l.product.releaseDate?.toISOString().slice(0, 10) ?? null,
          },
        }
      : {}),
    ...(l.experience
      ? {
          experience: {
            durationMinutes: l.experience.durationMinutes,
            startPoint: l.experience.startPoint,
          },
        }
      : {}),
    ...(l.event
      ? {
          event: {
            startsAt: iso(l.event.startsAt),
            endsAt: iso(l.event.endsAt),
            venueListingId: l.event.venueListingId,
          },
        }
      : {}),
    ...(l.guide
      ? {
          guide: {
            languages: l.guide.languages,
            licenseVerifiedAt: iso(l.guide.licenseVerifiedAt),
            consentAt: iso(l.guide.consentAt),
          },
        }
      : {}),
  };
}

function dateOrNull(v: string | null | undefined): Date | null {
  return v ? new Date(v) : null;
}

function stripUndefined<T extends Record<string, unknown>>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

function versionConflict(): ProblemException {
  return new ProblemException(
    HttpStatus.PRECONDITION_FAILED,
    'PRECONDITION_FAILED',
    'Listeleme başka biri tarafından değiştirildi; sayfayı yenileyip yeniden dene',
  );
}
