import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { z } from 'zod';
import type {
  AdminDataRequestCreateBody,
  AdminDataRequestUpdateBody,
  BreachCreateBody,
  DataRequestCreateBody,
} from '@incelemeler/contracts';
import { ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import { signToken, verifyToken } from '../../common/signed-token.js';
import { ENV, type EnvToken } from '../../config/env.provider.js';
import type { BreachIncident, DataSubjectRequest } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthContext } from '../identity/auth.context.js';
import { EMAIL_PORT, type EmailPort } from '../notifications/email.port.js';
import { privacyEmails } from '../notifications/email-templates.js';
import { AuditService } from '../platform/audit.service.js';
import { RateLimitService } from '../platform/rate-limit.service.js';
import { ComplianceService } from './compliance.service.js';

const DAY = 86_400_000;
const VERIFY_PURPOSE = 'dsr-verify';
const VERIFY_TTL = 72 * 3_600_000;

const notFound = () =>
  new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Başvuru bulunamadı');
const invalid = (pointer: string, code: string, message: string) =>
  new ProblemException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'VALIDATION_FAILED',
    'Başvuru kuralları sağlanmadı',
    undefined,
    [{ pointer, code, message }],
  );

/** Süre uyarısı: sürenin 10 ve 3 gün öncesi (30 günde 20. ve 27. gün), süre aşımında alarm. */
export function dsrAlert(
  r: Pick<DataSubjectRequest, 'status' | 'receivedAt'>,
  responseDays: number,
  now = new Date(),
) {
  const daysElapsed = Math.floor((now.getTime() - r.receivedAt.getTime()) / DAY);
  if (r.status === 'ANSWERED' || r.status === 'REJECTED')
    return { daysElapsed, alert: 'NONE' as const };
  if (daysElapsed >= responseDays) return { daysElapsed, alert: 'OVERDUE' as const };
  if (daysElapsed >= responseDays - 3) return { daysElapsed, alert: 'WARN_27' as const };
  if (daysElapsed >= responseDays - 10) return { daysElapsed, alert: 'WARN_20' as const };
  return { daysElapsed, alert: 'NONE' as const };
}

/**
 * KVKK başvuruları (REQ-KVK-022) ve ihlal kayıtları (REQ-KVK-024). Kimlik doğrulaması oturum ya da kayıtlı
 * e-postaya gönderilen bağlantıyla yapılır; gereksiz kimlik verisi (kimlik no vb.) istenmez.
 */
@Injectable()
export class PrivacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly rateLimit: RateLimitService,
    private readonly compliance: ComplianceService,
    @Inject(EMAIL_PORT) private readonly email: EmailPort,
    @Inject(ENV) private readonly env: EnvToken,
  ) {}

  async create(
    ctx: AuthContext | null,
    body: z.infer<typeof DataRequestCreateBody>,
    meta: RequestMeta,
  ) {
    await this.rateLimit.enforce(`dsr:ip:${meta.ipPrefix ?? meta.ip}`, 5, 3600);
    const user = ctx ? await this.prisma.user.findUnique({ where: { id: ctx.userId } }) : null;
    const email = user?.email ?? body.email;
    if (!email) throw invalid('/email', 'required', 'E-posta gerekli');
    const cfg = await this.compliance.get();
    const now = new Date();
    const r = await this.prisma.dataSubjectRequest.create({
      data: {
        type: body.type,
        channel: 'WEB_FORM',
        userId: user?.id ?? null,
        email,
        description: body.description,
        identityVerified: !!user,
        receivedAt: now,
        dueAt: new Date(now.getTime() + cfg.dsrResponseDays * DAY),
      },
    });
    if (!user) {
      const token = signToken(
        { r: r.id },
        this.env.CURSOR_SECRET,
        VERIFY_PURPOSE,
        VERIFY_TTL,
      ).token;
      const t = privacyEmails.verifyRequest(
        `${this.env.WEB_BASE_URL}/kvkk-basvuru/dogrula?belirtec=${encodeURIComponent(token)}`,
      );
      await this.email.send({ to: email, ...t, category: 'transactional' });
    } else {
      await this.email.send({
        to: email,
        ...privacyEmails.received(cfg.dsrResponseDays),
        category: 'transactional',
      });
    }
    return { accepted: true as const, verificationRequired: !user };
  }

  async verify(token: string) {
    const t = verifyToken<{ r: string }>(token, this.env.CURSOR_SECRET, VERIFY_PURPOSE);
    if (!t) {
      throw new ProblemException(
        HttpStatus.BAD_REQUEST,
        'INVALID_TOKEN',
        'Bağlantı geçersiz ya da süresi dolmuş',
      );
    }
    const r = await this.prisma.dataSubjectRequest.update({
      where: { id: t.r },
      data: { identityVerified: true, version: { increment: 1 } },
    });
    const cfg = await this.compliance.get();
    await this.email.send({
      to: r.email,
      ...privacyEmails.received(cfg.dsrResponseDays),
      category: 'transactional',
    });
    return { accepted: true as const };
  }

  // ── Panel ──

  async list(now = new Date()) {
    const cfg = await this.compliance.get();
    const rows = await this.prisma.dataSubjectRequest.findMany({
      orderBy: [{ dueAt: 'asc' }],
      take: 500,
    });
    const data = rows.map((r) => this.dto(r, cfg.dsrResponseDays, now));
    return { data, overdue: data.filter((d) => d.alert === 'OVERDUE').length };
  }

  async createManual(
    ctx: AuthContext,
    body: z.infer<typeof AdminDataRequestCreateBody>,
    meta: RequestMeta,
  ) {
    const cfg = await this.compliance.get();
    const receivedAt = body.receivedAt ? new Date(body.receivedAt) : new Date();
    const r = await this.prisma.$transaction(async (tx) => {
      const created = await tx.dataSubjectRequest.create({
        data: {
          type: body.type,
          channel: 'MANUAL',
          email: body.email,
          description: body.description,
          receivedAt,
          dueAt: new Date(receivedAt.getTime() + cfg.dsrResponseDays * DAY),
          handledById: ctx.userId,
        },
      });
      await this.record(tx, ctx, 'privacy.dsr.created', created.id, meta, { type: body.type });
      return created;
    });
    return this.dto(r, cfg.dsrResponseDays);
  }

  async update(
    ctx: AuthContext,
    id: string,
    body: z.infer<typeof AdminDataRequestUpdateBody>,
    meta: RequestMeta,
  ) {
    if (body.status === 'REJECTED' && !body.rejectionReason) {
      throw invalid('/rejectionReason', 'required', 'Ret gerekçesi zorunlu');
    }
    const cfg = await this.compliance.get();
    const r = await this.prisma.$transaction(async (tx) => {
      const res = await tx.dataSubjectRequest.updateMany({
        where: { id, version: body.version },
        data: {
          status: body.status,
          ...(body.responseNote !== undefined ? { responseNote: body.responseNote } : {}),
          rejectionReason: body.status === 'REJECTED' ? body.rejectionReason! : null,
          ...(body.identityVerified !== undefined
            ? { identityVerified: body.identityVerified }
            : {}),
          answeredAt: body.status === 'ANSWERED' || body.status === 'REJECTED' ? new Date() : null,
          handledById: ctx.userId,
          version: { increment: 1 },
        },
      });
      if (res.count === 0) {
        const exists = await tx.dataSubjectRequest.count({ where: { id } });
        if (!exists) throw notFound();
        throw new ProblemException(
          HttpStatus.PRECONDITION_FAILED,
          'PRECONDITION_FAILED',
          'Başvuru başka bir oturumda değiştirildi',
        );
      }
      await this.record(tx, ctx, 'privacy.dsr.updated', id, meta, {
        status: body.status,
        rejectionReason: body.rejectionReason ?? null,
      });
      return tx.dataSubjectRequest.findUniqueOrThrow({ where: { id } });
    });
    return this.dto(r, cfg.dsrResponseDays);
  }

  async breaches() {
    const rows = await this.prisma.breachIncident.findMany({ orderBy: { detectedAt: 'desc' } });
    return { data: rows.map(breachDto) };
  }

  async createBreach(ctx: AuthContext, body: z.infer<typeof BreachCreateBody>, meta: RequestMeta) {
    const b = await this.prisma.$transaction(async (tx) => {
      const created = await tx.breachIncident.create({
        data: {
          detectedAt: new Date(body.detectedAt),
          summary: body.summary,
          dataCategories: body.dataCategories,
          affectedCount: body.affectedCount ?? null,
          createdById: ctx.userId,
        },
      });
      await this.audit.record(
        {
          actorId: ctx.userId,
          actorRole: ctx.roles.join(','),
          action: 'privacy.breach.created',
          targetType: 'breach_incident',
          targetId: created.id,
          ipPrefix: meta.ipPrefix,
          traceId: meta.traceId,
        },
        tx,
      );
      return created;
    });
    return breachDto(b);
  }

  private dto(r: DataSubjectRequest, responseDays: number, now = new Date()) {
    const { daysElapsed, alert } = dsrAlert(r, responseDays, now);
    return {
      id: r.id,
      type: r.type,
      channel: r.channel as 'WEB_FORM' | 'IN_APP' | 'MANUAL',
      email: r.email,
      description: r.description,
      identityVerified: r.identityVerified,
      status: r.status,
      receivedAt: r.receivedAt.toISOString(),
      dueAt: r.dueAt.toISOString(),
      daysElapsed,
      alert,
      answeredAt: r.answeredAt?.toISOString() ?? null,
      responseNote: r.responseNote,
      rejectionReason: r.rejectionReason as never,
      version: r.version,
    };
  }

  private record(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    ctx: AuthContext,
    action: string,
    targetId: string,
    meta: RequestMeta,
    summary: Record<string, string | null>,
  ) {
    return this.audit.record(
      {
        actorId: ctx.userId,
        actorRole: ctx.roles.join(','),
        action,
        targetType: 'data_subject_request',
        targetId,
        summary,
        ipPrefix: meta.ipPrefix,
        traceId: meta.traceId,
      },
      tx,
    );
  }
}

function breachDto(b: BreachIncident) {
  return {
    id: b.id,
    detectedAt: b.detectedAt.toISOString(),
    summary: b.summary,
    stage: b.stage as 'DETECTED',
    dataCategories: b.dataCategories,
    affectedCount: b.affectedCount,
    notifyDeadline: b.notifyDeadline?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
  };
}
