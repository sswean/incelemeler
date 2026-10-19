import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import type { z } from 'zod';
import {
  CAMPAIGN_TRANSITIONS,
  type Campaign as CampaignDto,
  type CampaignCreateBody,
  type CampaignReport,
  type CampaignTransitionBody,
  type CampaignUpdateBody,
  type CreativeCreateBody,
  type CreativeReviewBody,
  type OrganizationBody,
  type PlacementCreateBody,
  type PlacementSlotUpdateBody,
  SURFACE_CAPS,
  slotRuleErrors,
} from '@incelemeler/contracts';
import { slugifyTr } from '@incelemeler/utils';
import { type FieldError, ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import type { Prisma, PlacementSlot } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { can } from '../access/permissions.js';
import { assertFreshStepUp } from '../identity/auth.guard.js';
import type { AuthContext } from '../identity/auth.context.js';
import { AuditService } from '../platform/audit.service.js';
import { SponsoredServingService } from './sponsored-serving.service.js';

const notFound = () =>
  new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Kampanya bulunamadı');
const forbidden = (detail: string) =>
  new ProblemException(HttpStatus.FORBIDDEN, 'FORBIDDEN', detail);
const conflict = (detail: string) => new ProblemException(HttpStatus.CONFLICT, 'CONFLICT', detail);
const versionConflict = () =>
  new ProblemException(
    HttpStatus.PRECONDITION_FAILED,
    'PRECONDITION_FAILED',
    'Kayıt başka bir oturumda değiştirildi',
  );
const invalid = (errors: FieldError[]) =>
  new ProblemException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'VALIDATION_FAILED',
    'Kampanya kuralları sağlanmadı',
    undefined,
    errors,
  );
const fe = (pointer: string, code: string, message: string): FieldError => ({
  pointer,
  code,
  message,
});

const INCLUDE = {
  sponsor: { select: { id: true, name: true } },
  placements: {
    include: {
      slot: { select: { id: true, key: true, name: true, surface: true } },
      listing: { select: { id: true, slug: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
  creatives: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.CampaignInclude;
type CampaignRow = Prisma.CampaignGetPayload<{ include: typeof INCLUDE }>;

/**
 * Kampanya yönetimi (Ek A8.4, REQ-SPN-001/004/006/011/013): satış → editoryal onay → planlama; tutar
 * yalnızca `campaigns.amount`; tüm değişiklikler denetim kaydında.
 */
@Injectable()
export class CampaignsService {
  private readonly logger = new Logger('Campaigns');

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly serving: SponsoredServingService,
  ) {}

  // ── Yuvalar ──

  async slots() {
    const rows = await this.prisma.placementSlot.findMany({ orderBy: { key: 'asc' } });
    return { data: rows.map(slotDto) };
  }

  async updateSlot(
    ctx: AuthContext,
    id: string,
    body: z.infer<typeof PlacementSlotUpdateBody>,
    meta: RequestMeta,
  ) {
    const slot = await this.prisma.placementSlot.findUnique({ where: { id } });
    if (!slot) throw notFound();
    const positions = body.positions ?? slot.positions;
    const maxItems = body.maxItems ?? slot.maxItems;
    const errors = slotRuleErrors(slot.surface, maxItems, positions);
    if (errors.length) {
      throw invalid(
        errors.map((code) => fe('/positions', code, 'Yerleşim sınırı aşılamaz (A8.3)')),
      );
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.placementSlot.updateMany({
        where: { id, version: body.version },
        data: {
          positions: [...positions].sort((a, b) => a - b),
          maxItems,
          ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
          version: { increment: 1 },
        },
      });
      if (res.count === 0) throw versionConflict();
      await this.record(tx, ctx, 'sponsorship.slot.updated', 'placement_slot', id, meta, {
        from: { positions: slot.positions, maxItems: slot.maxItems, enabled: slot.enabled },
        to: { positions, maxItems, enabled: body.enabled ?? slot.enabled },
      });
      return tx.placementSlot.findUniqueOrThrow({ where: { id } });
    });
    return slotDto(updated);
  }

  // ── Kuruluşlar ──

  async organizations() {
    const rows = await this.prisma.organization.findMany({ orderBy: { name: 'asc' }, take: 500 });
    return {
      data: rows.map((o) => ({
        id: o.id,
        type: o.type,
        slug: o.slug,
        name: o.name,
        dataOrigin: o.dataOrigin,
      })),
    };
  }

  async createOrganization(
    ctx: AuthContext,
    body: z.infer<typeof OrganizationBody>,
    meta: RequestMeta,
  ) {
    const base = slugifyTr(body.name) || 'kurulus';
    let slug = base;
    for (let i = 2; await this.prisma.organization.findUnique({ where: { slug } }); i++) {
      slug = `${base}-${i}`;
    }
    const o = await this.prisma.$transaction(async (tx) => {
      const created = await tx.organization.create({ data: { ...body, slug } });
      await this.record(tx, ctx, 'organization.created', 'organization', created.id, meta, {
        type: body.type,
      });
      return created;
    });
    return { id: o.id, type: o.type, slug: o.slug, name: o.name, dataOrigin: o.dataOrigin };
  }

  // ── Kampanyalar ──

  async list() {
    const rows = await this.prisma.campaign.findMany({
      include: { sponsor: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return {
      data: rows.map((c) => ({
        id: c.id,
        name: c.name,
        sponsor: c.sponsor,
        status: c.status,
        startsAt: c.startsAt.toISOString(),
        endsAt: c.endsAt.toISOString(),
        dataOrigin: c.dataOrigin,
      })),
    };
  }

  async get(ctx: AuthContext, id: string): Promise<CampaignDto> {
    const c = await this.prisma.campaign.findUnique({ where: { id }, include: INCLUDE });
    if (!c) throw notFound();
    return this.dto(ctx, c);
  }

  async create(ctx: AuthContext, body: z.infer<typeof CampaignCreateBody>, meta: RequestMeta) {
    this.assertAmount(ctx, body.budgetKurus);
    const errors = this.dateErrors(body.startsAt, body.endsAt);
    if (errors.length) throw invalid(errors);
    const sponsor = await this.prisma.organization.findUnique({ where: { id: body.sponsorId } });
    if (!sponsor) throw invalid([fe('/sponsorId', 'invalid', 'Kuruluş bulunamadı')]);
    const c = await this.prisma.$transaction(async (tx) => {
      const created = await tx.campaign.create({
        data: {
          name: body.name,
          sponsorId: sponsor.id,
          startsAt: new Date(body.startsAt),
          endsAt: new Date(body.endsAt),
          budgetKurus: body.budgetKurus != null ? BigInt(body.budgetKurus) : null,
          contractRef: body.contractRef ?? null,
          dataOrigin: sponsor.dataOrigin,
          createdById: ctx.userId,
        },
      });
      await this.record(tx, ctx, 'sponsorship.campaign.created', 'campaign', created.id, meta, {
        name: body.name,
        sponsorId: sponsor.id,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        budgetSet: body.budgetKurus != null,
      });
      return created;
    });
    return this.get(ctx, c.id);
  }

  async update(
    ctx: AuthContext,
    id: string,
    body: z.infer<typeof CampaignUpdateBody>,
    meta: RequestMeta,
  ) {
    const c = await this.prisma.campaign.findUnique({ where: { id } });
    if (!c) throw notFound();
    this.assertAmount(ctx, body.budgetKurus);
    const { version, ...rest } = body;
    const scheduling = ['name', 'sponsorId', 'startsAt', 'endsAt'].some(
      (k) => rest[k as keyof typeof rest] !== undefined,
    );
    // Onaylanan içerik/tarih sonradan değişmez: yalnızca taslakta (tutar ve sözleşme her zaman, yetkiyle).
    if (scheduling && c.status !== 'DRAFT') throw conflict('Yalnızca taslak kampanya düzenlenir');
    const startsAt = rest.startsAt ?? c.startsAt.toISOString();
    const endsAt = rest.endsAt ?? c.endsAt.toISOString();
    const errors = scheduling ? this.dateErrors(startsAt, endsAt) : [];
    if (errors.length) throw invalid(errors);
    await this.prisma.$transaction(async (tx) => {
      const res = await tx.campaign.updateMany({
        where: { id, version },
        data: {
          ...(rest.name !== undefined ? { name: rest.name } : {}),
          ...(rest.sponsorId !== undefined ? { sponsorId: rest.sponsorId } : {}),
          ...(rest.startsAt !== undefined ? { startsAt: new Date(rest.startsAt) } : {}),
          ...(rest.endsAt !== undefined ? { endsAt: new Date(rest.endsAt) } : {}),
          ...(rest.budgetKurus !== undefined
            ? { budgetKurus: rest.budgetKurus === null ? null : BigInt(rest.budgetKurus) }
            : {}),
          ...(rest.contractRef !== undefined ? { contractRef: rest.contractRef } : {}),
          version: { increment: 1 },
        },
      });
      if (res.count === 0) throw versionConflict();
      await this.record(tx, ctx, 'sponsorship.campaign.updated', 'campaign', id, meta, {
        fields: Object.keys(rest),
        // Tutar değişikliği ayrıca kayda geçer (REQ-SPN-013); değer yalnızca yetkili rolün göreceği kayıtta.
        ...(rest.budgetKurus !== undefined
          ? {
              budgetFrom: c.budgetKurus?.toString() ?? null,
              budgetTo: rest.budgetKurus?.toString() ?? null,
            }
          : {}),
      });
    });
    return this.get(ctx, id);
  }

  async transition(
    ctx: AuthContext,
    id: string,
    body: z.infer<typeof CampaignTransitionBody>,
    meta: RequestMeta,
  ) {
    const c = await this.prisma.campaign.findUnique({ where: { id }, include: INCLUDE });
    if (!c) throw notFound();
    if (c.version !== body.version) throw versionConflict();
    const rule = CAMPAIGN_TRANSITIONS[body.action];
    if (!rule.from.includes(c.status)) throw conflict('Bu durumda bu eylem yapılamaz');

    const data: Prisma.CampaignUncheckedUpdateManyInput = {};
    const now = new Date();
    if (body.action === 'approve_editorial') {
      // Editoryal onay: içerik, etiket ve kategori uygunluğu (sponsorshipAllowed).
      if (!can(ctx.roles, 'content.publish')) throw forbidden('Editoryal onay yetkin yok');
      if (c.salesApprovedById === ctx.userId) {
        throw forbidden('Satış onayını veren kişi editoryal onay veremez');
      }
      if (c.creatives.some((x) => x.approval === 'PENDING')) {
        throw invalid([fe('/creatives', 'creative_pending', 'Kreatifler karara bağlanmalı')]);
      }
      await this.assertPlacementsAllowed(c);
      data.editorialApprovedById = ctx.userId;
      data.editorialApprovedAt = now;
      if (c.salesApprovedAt) data.status = 'APPROVED';
    } else {
      if (!can(ctx.roles, 'campaigns.manage')) throw forbidden('Kampanya yetkin yok');
      if (body.action === 'approve_sales') {
        if (c.editorialApprovedById === ctx.userId) {
          throw forbidden('Editoryal onayı veren kişi satış onayı veremez');
        }
        data.salesApprovedById = ctx.userId;
        data.salesApprovedAt = now;
        if (c.editorialApprovedAt) data.status = 'APPROVED';
      } else {
        if (body.action === 'submit' && !c.placements.length) {
          throw invalid([fe('/placements', 'placement_required', 'En az bir yerleşim gerekli')]);
        }
        if (body.action === 'schedule' || body.action === 'resume') {
          if (c.endsAt <= now) throw invalid([fe('/endsAt', 'ended', 'Bitiş tarihi geçti')]);
          await this.assertPlacementsAllowed(c);
        }
        if (body.action === 'return_to_draft') {
          data.salesApprovedById = null;
          data.salesApprovedAt = null;
          data.editorialApprovedById = null;
          data.editorialApprovedAt = null;
        }
        data.status = rule.to!;
      }
    }
    await this.prisma.$transaction(async (tx) => {
      const res = await tx.campaign.updateMany({
        where: { id, version: body.version },
        data: { ...data, version: { increment: 1 } },
      });
      if (res.count === 0) throw versionConflict();
      const after = await tx.campaign.findUniqueOrThrow({
        where: { id },
        select: { status: true },
      });
      await this.record(tx, ctx, `sponsorship.campaign.${body.action}`, 'campaign', id, meta, {
        from: c.status,
        to: after.status,
      });
    });
    return this.get(ctx, id);
  }

  async addPlacement(
    ctx: AuthContext,
    id: string,
    body: z.infer<typeof PlacementCreateBody>,
    meta: RequestMeta,
  ) {
    const c = await this.prisma.campaign.findUnique({ where: { id } });
    if (!c) throw notFound();
    if (c.status !== 'DRAFT') throw conflict('Yerleşim yalnızca taslakta eklenir');
    const errors: FieldError[] = [];
    const slot = await this.prisma.placementSlot.findUnique({ where: { id: body.slotId } });
    if (!slot) errors.push(fe('/slotId', 'invalid', 'Yuva bulunamadı'));
    const listing = await this.prisma.listing.findFirst({
      where: { slug: body.listingSlug, deletedAt: null },
    });
    if (!listing) errors.push(fe('/listingSlug', 'listing_not_found', 'Listeleme bulunamadı'));
    if (slot && listing && slot.allowedKinds.length && !slot.allowedKinds.includes(listing.kind)) {
      errors.push(fe('/slotId', 'kind_not_allowed', 'Bu yuva bu listeleme türünü kabul etmez'));
    }
    const category = body.targetCategorySlug
      ? await this.prisma.category.findUnique({ where: { slug: body.targetCategorySlug } })
      : null;
    if (body.targetCategorySlug && !category) {
      errors.push(fe('/targetCategorySlug', 'invalid', 'Kategori bulunamadı'));
    }
    const area = body.targetProvinceSlug
      ? await this.prisma.adminArea.findFirst({
          where: { level: 'PROVINCE', slug: body.targetProvinceSlug },
        })
      : null;
    if (body.targetProvinceSlug && !area) {
      errors.push(fe('/targetProvinceSlug', 'invalid', 'İl bulunamadı'));
    }
    if (listing) {
      const cats = [listing.primaryCategoryId, ...(category ? [category.id] : [])];
      if (!(await this.serving.sponsorshipAllowed(cats))) {
        errors.push(
          fe('/listingSlug', 'sponsorship_not_allowed', 'Bu kategori sponsorluğa kapalı'),
        );
      }
    }
    if (errors.length) throw invalid(errors);
    await this.prisma.$transaction(async (tx) => {
      const p = await tx.campaignPlacement.create({
        data: {
          campaignId: id,
          slotId: slot!.id,
          listingId: listing!.id,
          targetCategoryId: category?.id ?? null,
          targetAreaId: area?.id ?? null,
          priority: body.priority,
          weight: body.weight,
        },
      });
      await tx.campaign.update({ where: { id }, data: { version: { increment: 1 } } });
      await this.record(tx, ctx, 'sponsorship.placement.created', 'campaign', id, meta, {
        placementId: p.id,
        slot: slot!.key,
        listingId: listing!.id,
        priority: body.priority,
        weight: body.weight,
      });
    });
    return this.get(ctx, id);
  }

  async removePlacement(ctx: AuthContext, placementId: string, meta: RequestMeta) {
    const p = await this.prisma.campaignPlacement.findUnique({
      where: { id: placementId },
      include: { campaign: true },
    });
    if (!p) throw notFound();
    if (p.campaign.status !== 'DRAFT') throw conflict('Yerleşim yalnızca taslakta kaldırılır');
    await this.prisma.$transaction(async (tx) => {
      await tx.campaignPlacement.delete({ where: { id: placementId } });
      await tx.campaign.update({
        where: { id: p.campaignId },
        data: { version: { increment: 1 } },
      });
      await this.record(tx, ctx, 'sponsorship.placement.deleted', 'campaign', p.campaignId, meta, {
        placementId,
      });
    });
    return this.get(ctx, p.campaignId);
  }

  async addCreative(
    ctx: AuthContext,
    id: string,
    body: z.infer<typeof CreativeCreateBody>,
    meta: RequestMeta,
  ) {
    const c = await this.prisma.campaign.findUnique({ where: { id } });
    if (!c) throw notFound();
    if (c.status !== 'DRAFT') throw conflict('Kreatif yalnızca taslakta eklenir');
    await this.prisma.$transaction(async (tx) => {
      const cr = await tx.creative.create({
        data: { campaignId: id, title: body.title, body: body.body ?? null },
      });
      await tx.campaign.update({ where: { id }, data: { version: { increment: 1 } } });
      await this.record(tx, ctx, 'sponsorship.creative.created', 'campaign', id, meta, {
        creativeId: cr.id,
      });
    });
    return this.get(ctx, id);
  }

  async reviewCreative(
    ctx: AuthContext,
    creativeId: string,
    body: z.infer<typeof CreativeReviewBody>,
    meta: RequestMeta,
  ) {
    if (!can(ctx.roles, 'content.publish')) throw forbidden('Editoryal karar yetkin yok');
    const cr = await this.prisma.creative.findUnique({ where: { id: creativeId } });
    if (!cr) throw notFound();
    await this.prisma.$transaction(async (tx) => {
      const res = await tx.creative.updateMany({
        where: { id: creativeId, version: body.version },
        data: {
          approval: body.decision,
          reviewedById: ctx.userId,
          reviewedAt: new Date(),
          version: { increment: 1 },
        },
      });
      if (res.count === 0) throw versionConflict();
      await this.record(tx, ctx, 'sponsorship.creative.reviewed', 'campaign', cr.campaignId, meta, {
        creativeId,
        decision: body.decision,
      });
    });
    return this.get(ctx, cr.campaignId);
  }

  // ── Rapor ──

  /**
   * Kampanya raporu (REQ-SPN-009/011): yalnızca sayılan (gerçek, tekilleştirilmiş, demo olmayan) olaylar;
   * görüntülenen gösterim esas; günlük kırılım Europe/Istanbul tarihine göre; kişisel veri yok.
   */
  async report(id: string): Promise<CampaignReport> {
    const c = await this.prisma.campaign.findUnique({
      where: { id },
      include: { placements: { include: { slot: true } } },
    });
    if (!c) throw notFound();
    const placementIds = c.placements.map((p) => p.id);
    type Row = { day: string; placement_id: string; type: string; n: bigint };
    const rows = placementIds.length
      ? await this.prisma.$queryRaw<Row[]>`
          SELECT to_char(created_at AT TIME ZONE 'Europe/Istanbul', 'YYYY-MM-DD') AS day,
                 placement_id::text AS placement_id, type::text AS type, count(*) AS n
          FROM sponsored_events
          WHERE placement_id = ANY(${placementIds}::uuid[]) AND counted
          GROUP BY 1, 2, 3 ORDER BY 1`
      : [];
    const [excluded, last] = await Promise.all([
      this.prisma.sponsoredEvent.count({
        where: { placementId: { in: placementIds }, counted: false },
      }),
      this.prisma.sponsoredEvent.findFirst({
        where: { placementId: { in: placementIds } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);
    const empty = () => ({ served: 0, viewed: 0, clicks: 0 });
    const add = (acc: ReturnType<typeof empty>, type: string, n: number) => {
      if (type === 'SERVED') acc.served += n;
      else if (type === 'VIEWED') acc.viewed += n;
      else if (type === 'CLICK') acc.clicks += n;
    };
    const withCtr = <T extends ReturnType<typeof empty>>(r: T) => ({
      ...r,
      ctr: r.viewed > 0 ? Math.round((r.clicks / r.viewed) * 10_000) / 10_000 : null,
    });
    const totals = empty();
    const days = new Map<string, ReturnType<typeof empty>>();
    const slots = new Map<
      string,
      ReturnType<typeof empty> & { slot: string; surface: PlacementSlot['surface'] }
    >();
    const slotOf = new Map(c.placements.map((p) => [p.id, p.slot]));
    for (const r of rows) {
      const n = Number(r.n);
      add(totals, r.type, n);
      if (!days.has(r.day)) days.set(r.day, empty());
      add(days.get(r.day)!, r.type, n);
      const s = slotOf.get(r.placement_id)!;
      if (!slots.has(s.key)) slots.set(s.key, { ...empty(), slot: s.key, surface: s.surface });
      add(slots.get(s.key)!, r.type, n);
    }
    // Adil pay: aynı yuvada, kampanya penceresinde sunulan yerleşimler içindeki payı.
    const share: CampaignReport['share'] = [];
    for (const s of new Map(c.placements.map((p) => [p.slot.id, p.slot])).values()) {
      const [mine, all] = await Promise.all([
        this.prisma.sponsoredEvent.count({
          where: {
            type: 'SERVED',
            counted: true,
            placementId: { in: placementIds },
            placement: { slotId: s.id },
          },
        }),
        this.prisma.sponsoredEvent.count({
          where: {
            type: 'SERVED',
            counted: true,
            placement: { slotId: s.id },
            createdAt: { gte: c.startsAt, lt: c.endsAt },
          },
        }),
      ]);
      share.push({
        slot: s.key,
        servedShare: all ? Math.round((mine / all) * 10_000) / 10_000 : null,
      });
    }
    return {
      campaignId: c.id,
      generatedAt: new Date().toISOString(),
      lastEventAt: last?.createdAt.toISOString() ?? null,
      totals: withCtr(totals),
      daily: [...days.entries()].map(([date, r]) => ({ date, ...withCtr(r) })),
      bySlot: [...slots.values()].map(withCtr),
      share,
      conversions: null,
      excluded,
    };
  }

  // ── Worker ──

  /** Durum güncellemesi (raporlama için): sunum zaten zaman penceresine bakar (REQ-SPN-005). */
  async tick(now = new Date()): Promise<void> {
    const live = await this.prisma.campaign.updateMany({
      where: { status: 'SCHEDULED', startsAt: { lte: now }, endsAt: { gt: now } },
      data: { status: 'LIVE', version: { increment: 1 } },
    });
    const done = await this.prisma.campaign.updateMany({
      where: { status: { in: ['SCHEDULED', 'LIVE'] }, endsAt: { lte: now } },
      data: { status: 'COMPLETED', version: { increment: 1 } },
    });
    if (live.count || done.count) {
      this.logger.log(
        JSON.stringify({ event: 'campaigns.tick', live: live.count, completed: done.count }),
      );
    }
  }

  // ── Yardımcılar ──

  private dateErrors(startsAt: string, endsAt: string): FieldError[] {
    return new Date(endsAt) <= new Date(startsAt)
      ? [fe('/endsAt', 'invalid', 'Bitiş başlangıçtan sonra olmalı')]
      : [];
  }

  /** Tutar alanı: ayrı izin + son 10 dakikada ikinci faktör (REQ-HSP-007, REQ-GUV-017). */
  private assertAmount(ctx: AuthContext, amount: number | null | undefined) {
    if (amount === undefined) return;
    if (!can(ctx.roles, 'campaigns.amount')) throw forbidden('Tutar alanı için yetkin yok');
    assertFreshStepUp(ctx);
  }

  private async assertPlacementsAllowed(c: CampaignRow) {
    for (const p of c.placements) {
      const l = await this.prisma.listing.findUniqueOrThrow({
        where: { id: p.listingId },
        select: { primaryCategoryId: true },
      });
      const cats = [l.primaryCategoryId, ...(p.targetCategoryId ? [p.targetCategoryId] : [])];
      if (!(await this.serving.sponsorshipAllowed(cats))) {
        throw invalid([
          fe(
            '/placements',
            'sponsorship_not_allowed',
            'Yerleşimlerden biri sponsorluğa kapalı kategoride',
          ),
        ]);
      }
    }
  }

  private async dto(ctx: AuthContext, c: CampaignRow): Promise<CampaignDto> {
    const [categories, areas] = await Promise.all([
      this.prisma.category.findMany({
        where: {
          id: { in: c.placements.flatMap((p) => (p.targetCategoryId ? [p.targetCategoryId] : [])) },
        },
        select: { id: true, slug: true, name: true },
      }),
      this.prisma.adminArea.findMany({
        where: {
          id: { in: c.placements.flatMap((p) => (p.targetAreaId ? [p.targetAreaId] : [])) },
        },
        select: { id: true, slug: true, name: true },
      }),
    ]);
    const cat = new Map(categories.map((x) => [x.id, { slug: x.slug, name: x.name }]));
    const area = new Map(areas.map((x) => [x.id, { slug: x.slug, name: x.name }]));
    return {
      id: c.id,
      name: c.name,
      sponsor: c.sponsor,
      status: c.status,
      startsAt: c.startsAt.toISOString(),
      endsAt: c.endsAt.toISOString(),
      budgetKurus:
        can(ctx.roles, 'campaigns.amount') && c.budgetKurus !== null ? Number(c.budgetKurus) : null,
      currency: c.currency,
      contractRef: c.contractRef,
      salesApprovedAt: c.salesApprovedAt?.toISOString() ?? null,
      editorialApprovedAt: c.editorialApprovedAt?.toISOString() ?? null,
      dataOrigin: c.dataOrigin,
      placements: c.placements.map((p) => ({
        id: p.id,
        slot: p.slot,
        listing: p.listing,
        targetCategory: p.targetCategoryId ? (cat.get(p.targetCategoryId) ?? null) : null,
        targetArea: p.targetAreaId ? (area.get(p.targetAreaId) ?? null) : null,
        priority: p.priority,
        weight: p.weight,
      })),
      creatives: c.creatives.map((x) => ({
        id: x.id,
        title: x.title,
        body: x.body,
        approval: x.approval,
        version: x.version,
      })),
      version: c.version,
    };
  }

  private record(
    tx: Prisma.TransactionClient,
    ctx: AuthContext,
    action: string,
    targetType: string,
    targetId: string,
    meta: RequestMeta,
    summary: Prisma.InputJsonObject,
  ) {
    return this.audit.record(
      {
        actorId: ctx.userId,
        actorRole: ctx.roles.join(','),
        action,
        targetType,
        targetId,
        summary,
        ipPrefix: meta.ipPrefix,
        traceId: meta.traceId,
      },
      tx,
    );
  }
}

function slotDto(s: PlacementSlot) {
  const cap = SURFACE_CAPS[s.surface];
  return {
    id: s.id,
    key: s.key,
    surface: s.surface,
    name: s.name,
    positions: s.positions,
    maxItems: s.maxItems,
    allowedKinds: s.allowedKinds,
    enabled: s.enabled,
    cap: { maxItems: cap.maxItems, firstTenMax: cap.firstTenMax },
    version: s.version,
  };
}
