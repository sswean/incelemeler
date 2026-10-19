import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  type AdminApplication,
  type ApplicationCreateBody,
  type ApplicationDecisionBody,
  type ApplicationRejection,
  type ApplicationStatus,
  type ApplicationType,
  isFreeEmailDomain,
} from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { slugifyTr } from '@incelemeler/utils';
import { ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import { signToken, verifyToken } from '../../common/signed-token.js';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import type { Application, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { can } from '../access/permissions.js';
import { AdminListingsService } from '../catalog/admin-listings.service.js';
import type { AuthContext } from '../identity/auth.context.js';
import { EMAIL_PORT, type EmailPort } from '../notifications/email.port.js';
import { applicationEmails } from '../notifications/email-templates.js';
import { AuditService } from '../platform/audit.service.js';
import { RateLimitService } from '../platform/rate-limit.service.js';
import { LegalService } from '../privacy/legal.service.js';

const VERIFY_PURPOSE = 'application-verify';
const VERIFY_TTL = 72 * 3_600_000;
const T = tr.applications;

type BusinessPayload = Extract<ApplicationCreateBody, { type: 'BUSINESS' }>;
type AdvertisingPayload = Extract<ApplicationCreateBody, { type: 'ADVERTISING' }>;

const problem = (status: HttpStatus, code: 'NOT_FOUND' | 'CONFLICT', title: string) =>
  new ProblemException(status, code, title);
const invalid = (pointer: string, code: string, message: string) =>
  new ProblemException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'VALIDATION_FAILED',
    'Başvuru doğrulanamadı',
    undefined,
    [{ pointer, code, message }],
  );

/** Başvuru türünü görebilen/karara bağlayabilen yetki (rol matrisi değişmeden — REQ-HSP-009). */
const PERMISSION_OF = {
  BUSINESS: 'listings.write',
  ADVERTISING: 'campaigns.manage',
} as const;

/**
 * Hesapsız başvurular (REQ-ISL-001/002, E2E-007): e-posta doğrulaması → yönetici kuyruğu → onay (işletme
 * başvurusunda listeleme taslağı) ya da gerekçeli ret. Doğrulanmayan başvurular saklama işinde silinir (A-028).
 */
@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly rateLimit: RateLimitService,
    private readonly legal: LegalService,
    private readonly listings: AdminListingsService,
    @Inject(EMAIL_PORT) private readonly email: EmailPort,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  async create(body: ApplicationCreateBody, meta: RequestMeta) {
    await this.rateLimit.enforce(`application:ip:${meta.ipPrefix ?? meta.ip}`, 5, 3600);
    await this.rateLimit.enforce(`application:email:${body.email}`, 3, 86_400);
    if (body.type === 'BUSINESS') await this.assertBusinessRefs(body);
    else await this.assertAdvertisingRefs(body);

    const { email, contactName } = body;
    const payload =
      body.type === 'BUSINESS'
        ? {
            kind: body.kind,
            categoryId: body.categoryId,
            provinceId: body.provinceId,
            districtId: body.districtId ?? null,
            address: body.address ?? null,
            serviceArea: body.serviceArea ?? null,
            website: body.website ?? null,
          }
        : {
            products: body.products,
            provinceIds: body.provinceIds,
            categoryIds: body.categoryIds,
            budgetRange: body.budgetRange ?? null,
            message: body.message,
          };
    const a = await this.prisma.application.create({
      data: {
        type: body.type,
        name: body.type === 'BUSINESS' ? body.businessName : body.organizationName,
        contactName,
        contactRole: body.contactRole ?? null,
        email,
        phone: body.phone ?? null,
        payload,
        privacyNoticeVersion: this.legal.currentVersion('PRIVACY_NOTICE'),
        marketingConsentAt:
          body.type === 'ADVERTISING' && body.marketingConsent ? new Date() : null,
      },
    });
    const token = signToken({ a: a.id }, this.env.CURSOR_SECRET, VERIFY_PURPOSE, VERIFY_TTL).token;
    const path = body.type === 'BUSINESS' ? '/isletmeni-ekle' : '/reklam-ve-sponsorluk';
    await this.email.send({
      to: email,
      ...applicationEmails.verify(
        T.kinds[body.type],
        `${this.env.WEB_BASE_URL}${path}/dogrula?belirtec=${encodeURIComponent(token)}`,
      ),
      category: 'transactional',
    });
    return { accepted: true as const, verificationRequired: true as const };
  }

  async verify(token: string) {
    const t = verifyToken<{ a: string }>(token, this.env.CURSOR_SECRET, VERIFY_PURPOSE);
    if (!t) {
      throw new ProblemException(
        HttpStatus.BAD_REQUEST,
        'INVALID_TOKEN',
        'Bağlantı geçersiz ya da süresi dolmuş',
      );
    }
    // Yalnızca ilk doğrulama kuyruğa alır; tekrar açılan bağlantı durumu değiştirmez.
    const moved = await this.prisma.application.updateMany({
      where: { id: t.a, status: 'UNVERIFIED' },
      data: { status: 'PENDING', emailVerifiedAt: new Date(), version: { increment: 1 } },
    });
    if (moved.count) {
      const a = await this.prisma.application.findUniqueOrThrow({ where: { id: t.a } });
      await this.email.send({
        to: a.email,
        ...applicationEmails.received(T.kinds[a.type]),
        category: 'transactional',
      });
    }
    return { accepted: true as const };
  }

  // ── Panel ──

  async list(ctx: AuthContext, q: { type?: ApplicationType; status: ApplicationStatus }) {
    const types = this.visibleTypes(ctx).filter((t) => !q.type || t === q.type);
    if (!types.length) return { data: [] };
    const rows = await this.prisma.application.findMany({
      where: { type: { in: types }, status: q.status },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: 200,
    });
    return { data: await this.dtos(rows) };
  }

  async decide(ctx: AuthContext, id: string, body: ApplicationDecisionBody, meta: RequestMeta) {
    const a = await this.prisma.application.findUnique({ where: { id } });
    if (!a || !this.visibleTypes(ctx).includes(a.type)) {
      throw problem(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Başvuru bulunamadı');
    }
    if (a.version !== body.version) {
      throw new ProblemException(
        HttpStatus.PRECONDITION_FAILED,
        'PRECONDITION_FAILED',
        'Başvuru başka biri tarafından güncellendi',
      );
    }
    if (a.status !== 'PENDING') {
      throw problem(
        HttpStatus.CONFLICT,
        'CONFLICT',
        a.status === 'UNVERIFIED'
          ? 'E-posta doğrulanmamış başvuru karara bağlanamaz'
          : 'Başvuru zaten karara bağlandı',
      );
    }
    const approve = body.decision === 'APPROVE';
    // İşletme başvurusu onayı: doğrulanmamış bilgiyle listeleme TASLAĞI (yayın editoryal doğrulamadan sonra).
    const listingId =
      approve && a.type === 'BUSINESS' ? await this.createDraft(ctx, a, meta) : null;
    const updated = await this.prisma.$transaction(async (tx) => {
      const moved = await tx.application.updateMany({
        where: { id, version: a.version, status: 'PENDING' },
        data: {
          status: approve ? 'APPROVED' : 'REJECTED',
          decidedAt: new Date(),
          decidedById: ctx.userId,
          rejectionReason: approve ? null : body.reason!,
          decisionNote: body.note ?? null,
          listingId,
          version: { increment: 1 },
        },
      });
      if (!moved.count) {
        throw new ProblemException(
          HttpStatus.PRECONDITION_FAILED,
          'PRECONDITION_FAILED',
          'Başvuru başka biri tarafından güncellendi',
        );
      }
      await this.audit.record(
        {
          actorId: ctx.userId,
          actorRole: ctx.roles.join(','),
          action: approve ? 'application.approved' : 'application.rejected',
          targetType: 'application',
          targetId: id,
          summary: { type: a.type, reason: approve ? null : body.reason!, listingId },
          ipPrefix: meta.ipPrefix,
          traceId: meta.traceId,
        },
        tx,
      );
      return tx.application.findUniqueOrThrow({ where: { id } });
    });
    const kind = T.kinds[a.type];
    await this.email.send({
      to: a.email,
      ...(approve
        ? applicationEmails.approved(kind, a.name)
        : applicationEmails.rejected(kind, a.name, T.rejections[body.reason!], body.note ?? null)),
      category: 'transactional',
    });
    return (await this.dtos([updated]))[0]!;
  }

  // ── Yardımcılar ──

  private visibleTypes(ctx: AuthContext): ApplicationType[] {
    return (Object.keys(PERMISSION_OF) as ApplicationType[]).filter((t) =>
      can(ctx.roles, PERMISSION_OF[t]),
    );
  }

  private async assertBusinessRefs(b: BusinessPayload) {
    const [category, province, district] = await Promise.all([
      this.prisma.category.findUnique({ where: { id: b.categoryId } }),
      this.prisma.adminArea.findUnique({ where: { id: b.provinceId } }),
      b.districtId ? this.prisma.adminArea.findUnique({ where: { id: b.districtId } }) : null,
    ]);
    if (!category || category.status !== 'PUBLISHED' || !category.allowedKinds.includes(b.kind)) {
      throw invalid(
        '/categoryId',
        'category_not_allowed',
        'Kategori bu işletme türü için uygun değil',
      );
    }
    if (!province || province.level !== 'PROVINCE') {
      throw invalid('/provinceId', 'unknown_province', 'İl bulunamadı');
    }
    if (b.districtId && (!district || district.parentId !== province.id)) {
      throw invalid('/districtId', 'district_mismatch', 'İlçe seçilen ile ait değil');
    }
  }

  private async assertAdvertisingRefs(b: AdvertisingPayload) {
    const [provinces, categories] = await Promise.all([
      this.prisma.adminArea.count({ where: { id: { in: b.provinceIds }, level: 'PROVINCE' } }),
      this.prisma.category.count({ where: { id: { in: b.categoryIds }, status: 'PUBLISHED' } }),
    ]);
    if (provinces !== new Set(b.provinceIds).size) {
      throw invalid('/provinceIds', 'unknown_province', 'İl bulunamadı');
    }
    if (categories !== new Set(b.categoryIds).size) {
      throw invalid('/categoryIds', 'unknown_category', 'Kategori bulunamadı');
    }
  }

  private async createDraft(ctx: AuthContext, a: Application, meta: RequestMeta) {
    const p = a.payload as {
      kind: BusinessPayload['kind'];
      categoryId: string;
      provinceId: string;
      districtId: string | null;
      address: string | null;
      website: string | null;
    };
    const base = slugifyTr(a.name);
    for (let n = 1; n <= 20; n++) {
      const slug = n === 1 ? base : `${base}-${n}`;
      const free =
        !(await this.prisma.listing.findUnique({ where: { slug }, select: { id: true } })) &&
        !(await this.prisma.slugHistory.findUnique({
          where: { entityType_slug: { entityType: 'listing', slug } },
        }));
      if (!free) continue;
      const listing = await this.listings.create(
        ctx,
        {
          kind: p.kind,
          dataOrigin: 'EDITORIAL',
          name: a.name,
          slug,
          primaryCategoryId: p.categoryId,
          contacts: {
            ...(a.phone ? { phone: a.phone } : {}),
            ...(p.website ? { website: p.website } : {}),
          },
          location: p.address
            ? { provinceId: p.provinceId, districtId: p.districtId, addressLine: p.address }
            : null,
          serviceAreaProvinceIds: p.address ? [] : [p.provinceId],
          source: `İşletme başvurusu (${a.createdAt.toISOString().slice(0, 10)}) — doğrulanmadı`,
        },
        meta,
      );
      return listing.id;
    }
    throw problem(HttpStatus.CONFLICT, 'CONFLICT', 'Listeleme adresi üretilemedi');
  }

  private async dtos(rows: Application[]): Promise<AdminApplication[]> {
    const ids = new Set<string>();
    for (const r of rows) {
      const p = r.payload as Record<string, unknown>;
      for (const k of ['categoryId', 'provinceId', 'districtId'])
        if (typeof p[k] === 'string') ids.add(p[k]);
      for (const k of ['provinceIds', 'categoryIds'])
        for (const v of (p[k] as string[] | undefined) ?? []) ids.add(v);
    }
    const [areas, cats] = await Promise.all([
      this.prisma.adminArea.findMany({ where: { id: { in: [...ids] } } }),
      this.prisma.category.findMany({ where: { id: { in: [...ids] } } }),
    ]);
    const name = new Map<string, string>([
      ...areas.map((x) => [x.id, x.name] as const),
      ...cats.map((x) => [x.id, x.name] as const),
    ]);
    const named = (id: unknown) =>
      typeof id === 'string' && name.has(id) ? { id, name: name.get(id)! } : null;
    return rows.map((r) => {
      const p = r.payload as Prisma.JsonObject;
      return {
        id: r.id,
        type: r.type,
        status: r.status,
        name: r.name,
        contactName: r.contactName,
        contactRole: r.contactRole,
        email: r.email,
        freeEmailDomain: isFreeEmailDomain(r.email),
        phone: r.phone,
        business:
          r.type === 'BUSINESS'
            ? {
                kind: p['kind'] as BusinessPayload['kind'],
                category: named(p['categoryId']),
                province: named(p['provinceId']),
                district: named(p['districtId']),
                address: (p['address'] as string | null) ?? null,
                serviceArea: (p['serviceArea'] as string | null) ?? null,
                website: (p['website'] as string | null) ?? null,
              }
            : null,
        advertising:
          r.type === 'ADVERTISING'
            ? {
                products: p['products'] as AdvertisingPayload['products'],
                provinces: (p['provinceIds'] as string[]).flatMap((x) => named(x) ?? []),
                categories: (p['categoryIds'] as string[]).flatMap((x) => named(x) ?? []),
                budgetRange: (p['budgetRange'] as AdvertisingPayload['budgetRange']) ?? null,
                message: p['message'] as string,
                marketingConsent: r.marketingConsentAt !== null,
              }
            : null,
        emailVerifiedAt: r.emailVerifiedAt?.toISOString() ?? null,
        decidedAt: r.decidedAt?.toISOString() ?? null,
        rejectionReason: r.rejectionReason as ApplicationRejection | null,
        decisionNote: r.decisionNote,
        listingId: r.listingId,
        createdAt: r.createdAt.toISOString(),
        version: r.version,
      };
    });
  }
}
