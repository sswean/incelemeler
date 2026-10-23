import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  type AttributeOption,
  isLicenseComplete,
  type ListingContacts,
  type PublicListing,
  type SitemapPage,
  type SlugResolution,
} from '@incelemeler/contracts';
import { decodeCursor, encodeCursor, InvalidCursorError } from '../../common/cursor.js';
import { ProblemException } from '../../common/problem.js';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { openingHoursDto } from './opening-hours.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { toMediaDto } from '../media/media.service.js';
import { STORAGE_PORT, type StoragePort } from '../media/storage.port.js';
import { CategorySchemaService } from '../taxonomy/category-schema.service.js';
import { PUBLISHED_VERDICT, publicVerdictDto } from '../editorial/verdicts.service.js';

/** Herkese açık durumlar: yayında ve kapalı (sayfa korunur — REQ-LST-006). */
const PUBLIC_STATUSES = ['PUBLISHED', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY'] as const;
const CAR_RENTAL_SLUG = 'arac-kiralama';

const INCLUDE = {
  primaryCategory: { include: { parent: { include: { parent: true } } } },
  location: { include: { province: true, district: true } },
  lodging: true,
  product: true,
  experience: true,
  event: true,
  guide: true,
  ratingStats: { select: { count: true } },
  integrityNotices: { orderBy: { detectedAt: 'desc' as const }, take: 1 },
  openingHours: true,
  openingExceptions: { orderBy: { date: 'desc' as const }, take: 60 },
  verdicts: PUBLISHED_VERDICT,
} satisfies Prisma.ListingInclude;
/** Bütünlük bildiriminin görünme süresi (A-030). */
const INTEGRITY_NOTICE_MS = 180 * 86_400_000;

/**
 * Herkese açık listeleme okuma (REQ-SEO-001/012, REQ-LST-002/006, REQ-VER-013).
 * Üretimde DEMO kayıtlar hiçbir yüzeyde dönmez (AK-03); taslak/arşiv görünmez.
 */
@Injectable()
export class PublicListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schemas: CategorySchemaService,
    @Inject(ENV) private readonly env: EnvToken,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  private visible(): Prisma.ListingWhereInput {
    return {
      deletedAt: null,
      status: { in: [...PUBLIC_STATUSES] },
      ...(this.env.APP_ENV === 'production' ? { dataOrigin: { not: 'DEMO' } } : {}),
    };
  }

  async resolve(slug: string): Promise<SlugResolution> {
    const current = await this.prisma.listing.findFirst({
      where: { slug, ...this.visible() },
      include: { primaryCategory: { include: { parent: { include: { parent: true } } } } },
    });
    if (current) {
      return {
        status: 'ok',
        kind: current.kind,
        slug: current.slug,
        carRental: isCarRental(current),
      };
    }
    const history = await this.prisma.slugHistory.findUnique({
      where: { entityType_slug: { entityType: 'listing', slug } },
    });
    if (history) {
      const target = await this.prisma.listing.findFirst({
        where: { id: history.entityId, ...this.visible() },
        include: { primaryCategory: { include: { parent: { include: { parent: true } } } } },
      });
      if (target) {
        return {
          status: 'moved',
          kind: target.kind,
          slug: target.slug,
          carRental: isCarRental(target),
        };
      }
    }
    // Bir kez yayımlanmış ama silinmiş/arşivlenmiş kayıt: 410 (REQ-SEO-012).
    const gone = await this.prisma.listing.findFirst({
      where: {
        OR: [{ slug }, ...(history ? [{ id: history.entityId }] : [])],
        publishedAt: { not: null },
        ...(this.env.APP_ENV === 'production' ? { dataOrigin: { not: 'DEMO' } } : {}),
      },
    });
    if (gone) return { status: 'gone', kind: gone.kind, slug: null, carRental: false };
    return { status: 'missing', kind: null, slug: null, carRental: false };
  }

  /** Organik listeleme ayrıntısı; dış bağlantılar (affiliate) sunum katmanında eklenir (REQ-MIM-005). */
  async get(slug: string): Promise<Omit<PublicListing, 'outbound'>> {
    const l = await this.prisma.listing.findFirst({
      where: { slug, ...this.visible() },
      include: INCLUDE,
    });
    if (!l) throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Listeleme bulunamadı');
    const schema = await this.schemas.effective(l.primaryCategoryId);
    const values = l.attributes as Record<string, unknown>;
    const attributes = schema.definitions
      .filter((d) => values[d.key] !== undefined && values[d.key] !== null && values[d.key] !== '')
      .map((d) => ({
        key: d.key,
        label: d.label,
        type: d.type,
        unit: d.unit,
        showOnCard: d.showOnCard,
        value: values[d.key],
        display: display(values[d.key], d.options, d.unit),
      }));
    const usages = await this.prisma.mediaUsage.findMany({
      where: { entityType: 'listing', entityId: l.id },
      include: { media: true },
      orderBy: { sortOrder: 'asc' },
    });
    const media = usages
      .map((u) => ({ usage: u, dto: toMediaDto(u.media) }))
      .filter(({ dto }) => dto.status === 'READY' && dto.licenseComplete && dto.altText)
      .map(({ usage, dto }) => ({
        id: dto.id,
        role: usage.role as 'PRIMARY' | 'GALLERY',
        width: dto.width,
        height: dto.height,
        altText: dto.altText!,
        blurhash: dto.blurhash,
        focalX: dto.focalX,
        focalY: dto.focalY,
        credit: dto.rightsHolder!,
      }));
    const loc = l.location;
    return {
      id: l.id,
      kind: l.kind,
      slug: l.slug,
      name: l.name,
      status: l.status,
      shortDescription: l.shortDescription,
      description: (l.description as PublicListing['description']) ?? null,
      category: {
        id: l.primaryCategory.id,
        name: l.primaryCategory.name,
        slug: l.primaryCategory.slug,
      },
      categoryPath: [l.primaryCategory.parent?.parent, l.primaryCategory.parent, l.primaryCategory]
        .filter((c): c is NonNullable<typeof c> => !!c)
        .map((c) => ({ name: c.name, slug: c.slug })),
      carRental: isCarRental(l),
      priceLevel: l.priceLevel,
      contacts: l.contacts as ListingContacts,
      location: loc
        ? {
            province: { name: loc.province.name, slug: loc.province.slug },
            district: loc.district ? { name: loc.district.name, slug: loc.district.slug } : null,
            neighborhood: loc.neighborhood,
            addressLine: loc.addressLine,
            postalCode: loc.postalCode,
            latitude: loc.latitude === null ? null : Number(loc.latitude),
            longitude: loc.longitude === null ? null : Number(loc.longitude),
          }
        : null,
      attributes,
      details: {
        ...(l.lodging
          ? {
              lodging: { checkInTime: l.lodging.checkInTime, checkOutTime: l.lodging.checkOutTime },
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
                startsAt: l.event.startsAt?.toISOString() ?? null,
                endsAt: l.event.endsAt?.toISOString() ?? null,
              },
            }
          : {}),
        ...(l.guide ? { guide: { languages: l.guide.languages } } : {}),
      },
      media,
      reviewCount: l.ratingStats?.count ?? 0,
      integrityNotice: integrityNotice(l.integrityNotices[0]),
      // Geçmiş istisnalar gösterilmez; dünkü istisna gece yarısını aşan aralık için gerekir (istek anında süzülür).
      openingHours: openingHoursDto(
        l,
        l.openingHours,
        l.openingExceptions.filter((e) => e.date.getTime() >= Date.now() - 2 * 86_400_000),
      ),
      editorialVerdict: l.verdicts[0] ? publicVerdictDto(l.verdicts[0]) : null,
      dataOrigin: l.dataOrigin,
      sourceVerifiedAt: l.sourceVerifiedAt?.toISOString() ?? null,
      publishedAt: l.publishedAt?.toISOString() ?? null,
      updatedAt: l.updatedAt.toISOString(),
    };
  }

  /** Görsel yalnızca lisansı tam ve herkese açık bir listelemeye bağlıysa sunulur. */
  async media(id: string): Promise<{ body: Buffer; contentType: string }> {
    const m = await this.prisma.mediaAsset.findUnique({ where: { id } });
    const notFound = () =>
      new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Görsel bulunamadı');
    if (!m || m.status !== 'READY' || !m.altText) throw notFound();
    if (!isLicenseComplete(toMediaDto(m))) throw notFound();
    const usages = await this.prisma.mediaUsage.findMany({
      where: { mediaId: id, entityType: 'listing' },
    });
    const visible = await this.prisma.listing.count({
      where: { id: { in: usages.map((u) => u.entityId) }, ...this.visible() },
    });
    if (!visible) throw notFound();
    const obj = await this.storage.get(m.storageKey);
    if (!obj) throw notFound();
    return obj;
  }

  /** Site haritası: yalnızca yayında, demo olmayan listelemeler (REQ-SEO-006). */
  async sitemap(cursor: string | undefined, limit: number): Promise<SitemapPage> {
    let afterId: string | undefined;
    if (cursor) {
      try {
        afterId = decodeCursor(cursor, this.env.CURSOR_SECRET).id;
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
        status: 'PUBLISHED',
        dataOrigin: { not: 'DEMO' },
        ...(afterId ? { id: { gt: afterId } } : {}),
      },
      include: { primaryCategory: { include: { parent: { include: { parent: true } } } } },
      orderBy: { id: 'asc' },
      take: limit + 1,
    });
    const page = rows.slice(0, limit);
    return {
      data: page.map((l) => ({
        kind: l.kind,
        slug: l.slug,
        carRental: isCarRental(l),
        lastmod: l.updatedAt.toISOString(),
      })),
      nextCursor:
        rows.length > limit
          ? encodeCursor({ k: [], id: page.at(-1)!.id }, this.env.CURSOR_SECRET)
          : null,
    };
  }
}

type WithChain = {
  kind: string;
  primaryCategory: {
    slug: string;
    parent: { slug: string; parent: { slug: string } | null } | null;
  };
};
function isCarRental(l: WithChain): boolean {
  const c = l.primaryCategory;
  return (
    l.kind === 'SERVICE_PROVIDER' &&
    [c.slug, c.parent?.slug, c.parent?.parent?.slug].includes(CAR_RENTAL_SLUG)
  );
}

/** Özellik değerinin Türkçe gösterimi (REQ-YRL-003). */
function display(value: unknown, options: AttributeOption[], unit: string | null): string {
  const label = (v: unknown) => options.find((o) => o.value === v)?.label ?? String(v);
  if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır';
  if (Array.isArray(value)) return value.map(label).join(', ');
  if (typeof value === 'number') {
    const n = new Intl.NumberFormat('tr-TR').format(value);
    return unit ? `${n} ${unit}` : n;
  }
  return label(value);
}

function integrityNotice(n: { detectedAt: Date; removedCount: number } | undefined) {
  if (!n || Date.now() - n.detectedAt.getTime() > INTEGRITY_NOTICE_MS) return null;
  return { detectedAt: n.detectedAt.toISOString(), removedCount: n.removedCount };
}
