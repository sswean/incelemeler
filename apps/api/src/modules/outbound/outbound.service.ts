import { createHash, createHmac } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { HttpStatus, Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import type { z } from 'zod';
import {
  CTA_RULES,
  type CtaType,
  type ListingKind,
  ListingContacts,
  type OutboundLink as OutboundLinkDto,
  type OutboundLinkCreateBody,
  type OutboundLinkUpdateBody,
  type ProviderBody,
  type ProviderUpdateBody,
  type PublicOutbound,
} from '@incelemeler/contracts';
import { type FieldError, ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import { signToken, verifyToken } from '../../common/signed-token.js';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import type { IntegrationProvider, OutboundLink, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { can } from '../access/permissions.js';
import type { AuthContext } from '../identity/auth.context.js';
import { OutboxService } from '../outbox/outbox.service.js';
import { AuditService } from '../platform/audit.service.js';
import { checkTarget, classifyClick, expandTemplate, normalizeDomain } from './outbound-url.js';
import { isPrivateAddress } from './ssrf.js';

const CTX_PURPOSE = 'outbound-ctx';
const CTX_TTL_MS = 30 * 86_400_000;
const DEDUPE_MS = 30_000;
const COMMERCIAL_KINDS = ['AFFILIATE', 'BOOKING', 'PURCHASE'];
const PUBLIC_LISTING = ['PUBLISHED', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY'];
const CHECK_TIMEOUT_MS = 3000;
const RECHECK_MS = 24 * 3_600_000;

export interface ClickContext {
  /** Yüzey (ör. listing_detail, article_card) — kişisel veri yok. */
  s: string;
  /** Sayfa türü. */
  p: string;
  /** Yerleşim kimliği (sponsorlu yuva — D9). */
  pl?: string;
  /** Sağlayıcıya iletilen alt kimlik (sayfa/yuva kodu). */
  sub?: string;
}
export interface ClickHeaders {
  ip: string;
  userAgent: string | null;
  secPurpose: string | null;
  purpose: string | null;
}

type LinkWithProvider = OutboundLink & { provider: IntegrationProvider | null };

const notFound = () =>
  new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Bağlantı bulunamadı');
const invalid = (errors: FieldError[]) =>
  new ProblemException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'VALIDATION_FAILED',
    'Bağlantı kuralları sağlanmadı',
    undefined,
    errors,
  );
const fe = (pointer: string, code: string, message: string): FieldError => ({
  pointer,
  code,
  message,
});

/**
 * Dış yönlendirme servisi (REQ-AFF-001…007): merkezi kayıt, imzalı bağlam, izinli alan adı denetimi,
 * tıklama kaydı (ham IP yok), bağlantı sağlığı. Affiliate ilişkisi sıralama/puan/editoryal seçime girmez (AK-04).
 */
@Injectable()
export class OutboundService implements OnModuleInit {
  private readonly logger = new Logger('Outbound');

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  onModuleInit(): void {
    // İletişim bilgilerindeki web sitesi/rezervasyon bağlantıları kayda eşitlenir (tüm dış bağlantılar kayıtta).
    for (const type of ['catalog.listing.created', 'catalog.listing.updated']) {
      this.outbox.register(type, (e) => this.syncContactLinks(e.aggregateId));
    }
  }

  signContext(ctx: ClickContext): string {
    return signToken({ ...ctx }, this.env.CURSOR_SECRET, CTX_PURPOSE, CTX_TTL_MS).token;
  }

  /** Listeleme sayfası için etkin bağlantılar; hedef URL değil, yalnızca `/git/` yolu döner. */
  async publicForListing(
    listingId: string,
    slug: string,
    now = new Date(),
  ): Promise<PublicOutbound[]> {
    const links = await this.prisma.outboundLink.findMany({
      where: {
        listingId,
        status: 'ACTIVE',
        OR: [{ validFrom: null }, { validFrom: { lte: now } }],
        AND: [{ OR: [{ validUntil: null }, { validUntil: { gt: now } }] }],
      },
      include: { provider: true },
      orderBy: { createdAt: 'asc' },
    });
    const ctx = this.signContext({
      s: 'listing_detail',
      p: 'listing',
      sub: `ldp-${slug}`.slice(0, 64),
    });
    return links
      .filter((l) => !l.provider || l.provider.integrationStatus !== 'DISABLED')
      .map((l) => ({
        id: l.id,
        kind: l.kind,
        ctaType: l.ctaType as PublicOutbound['ctaType'],
        label: l.label,
        commercialRelation: l.commercialRelation,
        providerName: l.provider?.name ?? null,
        href: `/git/${l.id}?ctx=${encodeURIComponent(ctx)}`,
      }));
  }

  /**
   * `/git/{id}` çözümü (REQ-AFF-002/003): hedef yalnızca kayıttan; izinli alan adı dışı hedef engellenir ve
   * alarm üretilir. Tıklama kaydı yönlendirmeyi bekletmez.
   */
  async resolve(
    id: string,
    ctxToken: string | undefined,
    headers: ClickHeaders,
  ): Promise<{ url: string }> {
    const link = await this.prisma.outboundLink.findUnique({
      where: { id },
      include: { provider: true, listing: { select: { status: true, deletedAt: true } } },
    });
    const now = new Date();
    if (!link || link.status !== 'ACTIVE') throw notFound();
    if (link.provider?.integrationStatus === 'DISABLED') throw notFound();
    if (link.listing && (link.listing.deletedAt || !PUBLIC_LISTING.includes(link.listing.status)))
      throw notFound();
    if (link.validFrom && link.validFrom > now) throw notFound();
    if (link.validUntil && link.validUntil <= now) {
      await this.prisma.outboundLink.updateMany({
        where: { id, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      });
      throw notFound();
    }
    const ctx = ctxToken
      ? verifyToken<ClickContext & Record<string, unknown>>(
          ctxToken,
          this.env.CURSOR_SECRET,
          CTX_PURPOSE,
        )
      : null;
    const url = expandTemplate(link.urlTemplate, { subId: ctx?.sub ?? '', surface: ctx?.s ?? '' });
    const check = checkTarget(url, this.domainsOf(link), { allowHttp: link.source === 'CONTACTS' });
    if (!check.ok) {
      // Alarm: kayıtlı hedef izin listesine uymuyor (kayıt sonrası değişiklik ya da kötüye kullanım girişimi).
      this.logger.warn(
        JSON.stringify({ event: 'outbound.blocked', linkId: id, reason: check.reason }),
      );
      await this.audit.record({
        actorId: null,
        actorRole: 'system',
        action: 'outbound.blocked',
        targetType: 'outbound_link',
        targetId: id,
        summary: { reason: check.reason },
      });
      throw notFound();
    }
    void this.recordClick(link.id, ctx, headers).catch((e: unknown) =>
      this.logger.warn(JSON.stringify({ event: 'outbound.click_failed', message: String(e) })),
    );
    return { url: check.url };
  }

  /** Günlük tuzlu oturum karması: ham IP ve kullanıcı ajanı saklanmaz (REQ-AFF-005, Ek A17). */
  sessionHash(ip: string, ua: string | null, now = new Date()): string {
    const day = now.toISOString().slice(0, 10);
    const salt = createHmac('sha256', this.env.CURSOR_SECRET)
      .update(`click-salt:${day}`)
      .digest('hex');
    return createHash('sha256')
      .update(`${salt}|${ip}|${ua ?? ''}`)
      .digest('hex');
  }

  private async recordClick(
    linkId: string,
    ctx: ClickContext | null,
    h: ClickHeaders,
  ): Promise<void> {
    const { bot, prefetch } = classifyClick(h);
    const sessionHash = this.sessionHash(h.ip, h.userAgent);
    // Tekilleştirme denetimi ve kayıt aynı oturum + bağlantı için sıralanır (art arda iki tıklama ikisi de
    // sayılmasın — denetle-sonra-yaz yarışı).
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`click:${linkId}:${sessionHash}`}, 0))`;
      const recent =
        bot || prefetch
          ? null
          : await tx.outboundClick.findFirst({
              where: {
                linkId,
                sessionHash,
                counted: true,
                createdAt: { gte: new Date(Date.now() - DEDUPE_MS) },
              },
              select: { id: true },
            });
      await tx.outboundClick.create({
        data: {
          linkId,
          surface: ctx?.s ?? 'unknown',
          pageType: ctx?.p ?? 'unknown',
          placementId: ctx?.pl ?? null,
          sessionHash,
          bot,
          prefetch,
          counted: !bot && !prefetch && !recent,
        },
      });
    });
  }

  // ── Panel ──

  async providers() {
    const rows = await this.prisma.integrationProvider.findMany({ orderBy: { name: 'asc' } });
    return { data: rows.map(providerDto) };
  }

  async createProvider(ctx: AuthContext, body: z.infer<typeof ProviderBody>, meta: RequestMeta) {
    const domains = this.domains(body.allowedDomains);
    try {
      const p = await this.prisma.$transaction(async (tx) => {
        const created = await tx.integrationProvider.create({
          data: {
            ...body,
            allowedDomains: domains,
            termsVerifiedAt: body.termsVerifiedAt ? new Date(body.termsVerifiedAt) : null,
          },
        });
        await this.record(
          tx,
          ctx,
          'outbound.provider.created',
          'integration_provider',
          created.id,
          meta,
          {
            key: body.key,
            integrationStatus: created.integrationStatus,
          },
        );
        return created;
      });
      return providerDto(p);
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002') {
        throw new ProblemException(HttpStatus.CONFLICT, 'CONFLICT', 'Bu anahtar kullanılıyor');
      }
      throw e;
    }
  }

  async updateProvider(
    ctx: AuthContext,
    id: string,
    body: z.infer<typeof ProviderUpdateBody>,
    meta: RequestMeta,
  ) {
    const { version, ...rest } = body;
    const data: Prisma.IntegrationProviderUpdateManyMutationInput = {
      ...rest,
      ...(rest.allowedDomains ? { allowedDomains: this.domains(rest.allowedDomains) } : {}),
      ...(rest.termsVerifiedAt !== undefined
        ? { termsVerifiedAt: rest.termsVerifiedAt ? new Date(rest.termsVerifiedAt) : null }
        : {}),
      version: { increment: 1 },
    };
    await this.prisma.$transaction(async (tx) => {
      const res = await tx.integrationProvider.updateMany({ where: { id, version }, data });
      if (res.count === 0) throw versionConflict();
      await this.record(tx, ctx, 'outbound.provider.updated', 'integration_provider', id, meta, {
        fields: Object.keys(rest),
      });
    });
    return providerDto(await this.prisma.integrationProvider.findUniqueOrThrow({ where: { id } }));
  }

  async linksForListing(listingId: string): Promise<{ data: OutboundLinkDto[] }> {
    const rows = await this.prisma.outboundLink.findMany({
      where: { listingId },
      include: { provider: true },
      orderBy: { createdAt: 'asc' },
    });
    return { data: await Promise.all(rows.map((r) => this.linkDto(r))) };
  }

  async createLink(
    ctx: AuthContext,
    body: z.infer<typeof OutboundLinkCreateBody>,
    meta: RequestMeta,
  ) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: body.listingId, deletedAt: null },
    });
    if (!listing) throw notFound();
    const commercial = COMMERCIAL_KINDS.includes(body.kind) || body.commercialRelation !== 'NONE';
    if (commercial && !can(ctx.roles, 'affiliate.manage')) {
      // Ticari bağlantı (affiliate/rezervasyon sağlayıcısı) yalnızca affiliate yetkisiyle (rol matrisi).
      throw new ProblemException(
        HttpStatus.FORBIDDEN,
        'FORBIDDEN',
        'Ticari bağlantı için yetkin yok',
      );
    }
    const provider = body.providerId
      ? await this.prisma.integrationProvider.findUnique({ where: { id: body.providerId } })
      : null;
    const errors = this.validateLink(listing.kind as ListingKind, body, provider);
    let allowedDomain: string | null = null;
    if (!errors.length && !provider) {
      const sample = expandTemplate(body.urlTemplate, { subId: 'x', surface: 'x' });
      try {
        allowedDomain = new URL(sample).hostname.toLowerCase();
      } catch {
        errors.push(fe('/urlTemplate', 'invalid_url', 'Geçerli bir https adresi gir'));
      }
    }
    if (errors.length) throw invalid(errors);
    const created = await this.prisma.$transaction(async (tx) => {
      const l = await tx.outboundLink.create({
        data: {
          listingId: listing.id,
          providerId: provider?.id ?? null,
          kind: body.kind,
          ctaType: body.ctaType,
          label: body.label ?? null,
          urlTemplate: body.urlTemplate,
          allowedDomain,
          commercialRelation: body.commercialRelation,
          validFrom: body.validFrom ? new Date(body.validFrom) : null,
          validUntil: body.validUntil ? new Date(body.validUntil) : null,
          createdById: ctx.userId,
        },
        include: { provider: true },
      });
      await this.record(tx, ctx, 'outbound.link.created', 'outbound_link', l.id, meta, {
        listingId: listing.id,
        kind: body.kind,
        commercialRelation: body.commercialRelation,
      });
      return l;
    });
    return this.linkDto(created);
  }

  async updateLink(
    ctx: AuthContext,
    id: string,
    body: z.infer<typeof OutboundLinkUpdateBody>,
    meta: RequestMeta,
  ) {
    const current = await this.prisma.outboundLink.findUnique({
      where: { id },
      include: { provider: true, listing: true },
    });
    if (!current) throw notFound();
    if (current.version !== body.version) throw versionConflict();
    if (body.urlTemplate && body.urlTemplate !== current.urlTemplate) {
      const sample = expandTemplate(body.urlTemplate, { subId: 'x', surface: 'x' });
      const check = checkTarget(sample, this.domainsOf(current), {
        allowHttp: current.source === 'CONTACTS',
      });
      if (!check.ok)
        throw invalid([fe('/urlTemplate', check.reason, 'Adres izinli alan adında değil')]);
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.outboundLink.updateMany({
        where: { id, version: body.version },
        data: {
          ...(body.status ? { status: body.status } : {}),
          ...(body.label !== undefined ? { label: body.label } : {}),
          ...(body.urlTemplate
            ? { urlTemplate: body.urlTemplate, lastCheckStatus: null, lastCheckedAt: null }
            : {}),
          ...(body.validUntil !== undefined
            ? { validUntil: body.validUntil ? new Date(body.validUntil) : null }
            : {}),
          version: { increment: 1 },
        },
      });
      if (res.count === 0) throw versionConflict();
      await this.record(tx, ctx, 'outbound.link.updated', 'outbound_link', id, meta, {
        fields: Object.keys(body).filter((k) => k !== 'version'),
      });
      return tx.outboundLink.findUniqueOrThrow({ where: { id }, include: { provider: true } });
    });
    return this.linkDto(updated);
  }

  /**
   * Bağlantı sağlığı (REQ-AFF-007): yalnızca izinli alan adı, DNS sonucu özel/yerel adresse istek atılmaz
   * (SSRF), yönlendirme takip edilmez; kırık bağlantı BROKEN, süresi dolan EXPIRED.
   */
  async check(id: string, now = new Date()) {
    const link = await this.prisma.outboundLink.findUnique({
      where: { id },
      include: { provider: true },
    });
    if (!link) throw notFound();
    let status = link.status;
    let note: string;
    if (link.validUntil && link.validUntil <= now) {
      status = 'EXPIRED';
      note = 'expired';
    } else {
      const url = expandTemplate(link.urlTemplate, { subId: '', surface: '' });
      const target = checkTarget(url, this.domainsOf(link), {
        allowHttp: link.source === 'CONTACTS',
      });
      if (!target.ok) {
        note = `blocked:${target.reason}`;
        status = 'BROKEN';
      } else {
        note = await this.probe(target.url, target.host);
        // Geçici ağ/DNS hataları durumu değiştirmez; yalnızca 4xx ve engellenen hedef kırık sayılır.
        if (note.startsWith('ok')) {
          if (link.status === 'BROKEN') status = 'ACTIVE';
        } else if (note.startsWith('http:4') || note.startsWith('blocked')) {
          status = link.status === 'DISABLED' ? 'DISABLED' : 'BROKEN';
        }
      }
    }
    const updated = await this.prisma.outboundLink.update({
      where: { id },
      data: { status, lastCheckedAt: now, lastCheckStatus: note },
      include: { provider: true },
    });
    if (status !== link.status) {
      this.logger.warn(
        JSON.stringify({
          event: 'outbound.health_changed',
          linkId: id,
          from: link.status,
          to: status,
          note,
        }),
      );
    }
    return this.linkDto(updated);
  }

  /** Worker: süresi dolanları kapatır, sırası gelen bağlantıları denetler. */
  async checkDue(limit = 20, now = new Date()): Promise<number> {
    await this.prisma.outboundLink.updateMany({
      where: { status: 'ACTIVE', validUntil: { lte: now } },
      data: { status: 'EXPIRED' },
    });
    const due = await this.prisma.outboundLink.findMany({
      where: {
        status: { in: ['ACTIVE', 'BROKEN'] },
        OR: [
          { lastCheckedAt: null },
          { lastCheckedAt: { lt: new Date(now.getTime() - RECHECK_MS) } },
        ],
      },
      select: { id: true },
      take: limit,
    });
    for (const d of due) await this.check(d.id, now);
    return due.length;
  }

  private async probe(url: string, host: string): Promise<string> {
    try {
      const addrs = await lookup(host, { all: true });
      if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address)))
        return 'blocked:private_address';
    } catch {
      return 'error:dns';
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CHECK_TIMEOUT_MS);
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: ctrl.signal });
      if (res.status >= 200 && res.status < 400) return `ok:${res.status}`;
      return `http:${res.status}`;
    } catch (e) {
      return (e as Error).name === 'AbortError' ? 'error:timeout' : 'error:network';
    } finally {
      clearTimeout(timer);
    }
  }

  /** İletişim bilgisindeki web sitesi/rezervasyon adresi kayıtlı, ticari olmayan bağlantıya eşitlenir. */
  async syncContactLinks(listingId: string): Promise<void> {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return;
    const contacts = ListingContacts.safeParse(listing.contacts);
    const c = contacts.success ? contacts.data : {};
    const rules = CTA_RULES[listing.kind as ListingKind].allowed;
    const wanted: Array<{ cta: CtaType; url: string | undefined }> = [
      { cta: rules.includes('OFFICIAL_SITE') ? 'OFFICIAL_SITE' : 'WEBSITE', url: c.website },
      { cta: rules.includes('RESERVATION') ? 'RESERVATION' : 'APPOINTMENT', url: c.reservationUrl },
    ];
    for (const w of wanted) {
      const existing = await this.prisma.outboundLink.findFirst({
        where: { listingId, source: 'CONTACTS', ctaType: w.cta },
      });
      if (!w.url || !rules.includes(w.cta)) {
        if (existing && existing.status === 'ACTIVE') {
          await this.prisma.outboundLink.update({
            where: { id: existing.id },
            data: { status: 'DISABLED', version: { increment: 1 } },
          });
        }
        continue;
      }
      const host = normalizeDomain(new URL(w.url).hostname);
      if (!host) continue;
      if (existing) {
        if (existing.urlTemplate !== w.url || existing.status !== 'ACTIVE') {
          await this.prisma.outboundLink.update({
            where: { id: existing.id },
            data: {
              urlTemplate: w.url,
              allowedDomain: host,
              status: 'ACTIVE',
              version: { increment: 1 },
            },
          });
        }
      } else {
        await this.prisma.outboundLink.create({
          data: {
            listingId,
            kind: 'WEBSITE',
            ctaType: w.cta,
            urlTemplate: w.url,
            allowedDomain: host,
            commercialRelation: 'NONE',
            source: 'CONTACTS',
          },
        });
      }
    }
  }

  private validateLink(
    kind: ListingKind,
    body: z.infer<typeof OutboundLinkCreateBody>,
    provider: IntegrationProvider | null,
  ): FieldError[] {
    const errors: FieldError[] = [];
    const rules = CTA_RULES[kind];
    if (
      !rules.allowed.includes(body.ctaType as CtaType) ||
      rules.forbidden.includes(body.ctaType as CtaType)
    ) {
      errors.push(fe('/ctaType', 'cta_not_allowed', 'Bu eylem bu listeleme türünde kullanılamaz'));
    }
    if (COMMERCIAL_KINDS.includes(body.kind) && !provider) {
      errors.push(
        fe('/providerId', 'provider_required', 'Ticari bağlantı bir sağlayıcıya bağlı olmalı'),
      );
    }
    if (body.providerId && !provider)
      errors.push(fe('/providerId', 'invalid', 'Sağlayıcı bulunamadı'));
    if (body.kind === 'AFFILIATE' && body.commercialRelation !== 'AFFILIATE') {
      errors.push(
        fe(
          '/commercialRelation',
          'affiliate_relation',
          'Affiliate bağlantısı "Ortaklık bağlantısı" ilişkisi taşır',
        ),
      );
    }
    try {
      const sample = expandTemplate(body.urlTemplate, { subId: 'x', surface: 'x' });
      const check = checkTarget(
        sample,
        provider ? provider.allowedDomains : [new URL(sample).hostname],
      );
      if (!check.ok) errors.push(fe('/urlTemplate', check.reason, 'Adres izinli değil'));
    } catch (e) {
      errors.push(
        fe(
          '/urlTemplate',
          /İzinsiz/.test(String(e)) ? 'template_variable' : 'invalid_url',
          'Geçerli bir https adresi gir',
        ),
      );
    }
    if (body.validFrom && body.validUntil && body.validUntil <= body.validFrom) {
      errors.push(fe('/validUntil', 'invalid', 'Bitiş başlangıçtan sonra olmalı'));
    }
    return errors;
  }

  private domainsOf(
    link: LinkWithProvider | (OutboundLink & { provider: IntegrationProvider | null }),
  ): string[] {
    return link.provider
      ? link.provider.allowedDomains
      : link.allowedDomain
        ? [link.allowedDomain]
        : [];
  }

  private domains(list: string[]): string[] {
    const out = list.map(normalizeDomain);
    if (out.some((d) => !d)) throw invalid([fe('/allowedDomains', 'invalid', 'Geçersiz alan adı')]);
    return [...new Set(out as string[])];
  }

  private async linkDto(l: LinkWithProvider): Promise<OutboundLinkDto> {
    const clicks30d = await this.prisma.outboundClick.count({
      where: {
        linkId: l.id,
        counted: true,
        createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) },
      },
    });
    return {
      id: l.id,
      listingId: l.listingId,
      provider: l.provider
        ? {
            id: l.provider.id,
            name: l.provider.name,
            integrationStatus: l.provider.integrationStatus,
          }
        : null,
      kind: l.kind,
      ctaType: l.ctaType as OutboundLinkDto['ctaType'],
      label: l.label,
      urlTemplate: l.urlTemplate,
      allowedDomain: l.allowedDomain,
      commercialRelation: l.commercialRelation,
      source: l.source as OutboundLinkDto['source'],
      validFrom: l.validFrom?.toISOString() ?? null,
      validUntil: l.validUntil?.toISOString() ?? null,
      status: l.status,
      lastCheckedAt: l.lastCheckedAt?.toISOString() ?? null,
      lastCheckStatus: l.lastCheckStatus,
      clicks30d,
      version: l.version,
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

function providerDto(p: IntegrationProvider) {
  return {
    id: p.id,
    key: p.key,
    name: p.name,
    integrationStatus: p.integrationStatus,
    docsUrl: p.docsUrl,
    termsUrl: p.termsUrl,
    termsVerifiedAt: p.termsVerifiedAt?.toISOString() ?? null,
    allowedDomains: p.allowedDomains,
    credentialEnvNames: p.credentialEnvNames,
    version: p.version,
    createdAt: p.createdAt.toISOString(),
  };
}

const versionConflict = () =>
  new ProblemException(
    HttpStatus.PRECONDITION_FAILED,
    'PRECONDITION_FAILED',
    'Kayıt başka bir oturumda değiştirildi',
  );
