import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { z } from 'zod';
import {
  type AdminTakedown,
  type AdminTakedownCreateBody,
  takedownAlert,
  type TakedownCreateBody,
  type TakedownKind,
  type TakedownUpdateBody,
} from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { formatLongDate } from '@incelemeler/utils';
import { ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import type { TakedownRequest } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthContext } from '../identity/auth.context.js';
import { EMAIL_PORT, type EmailPort } from '../notifications/email.port.js';
import { takedownEmails } from '../notifications/email-templates.js';
import { AuditService } from '../platform/audit.service.js';
import { RateLimitService } from '../platform/rate-limit.service.js';
import { ComplianceService } from '../privacy/compliance.service.js';
import { ReviewsService } from '../reviews/reviews.service.js';

const HOUR = 3_600_000;
const T = tr.takedown;
const reference = (id: string) => `HT-${id.replace(/-/g, '').slice(-8).toUpperCase()}`;
const notFound = () => new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Talep bulunamadı');

/**
 * Hukuki talepler ve bildirim-kaldırma (REQ-GUN-005): herkese açık form (hak sahibi talepleri) ve ayrı resmî karar
 * akışı (yalnızca panel, karar referansıyla). Süre `compliance_config`'ten; işlem yapılan değerlendirme hukuki
 * gerekçe koduyla kaldırılır ve istatistikten çıkar. Tüm kararlar denetim kaydında, talep edene e-postayla.
 */
@Injectable()
export class TakedownService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly rateLimit: RateLimitService,
    private readonly compliance: ComplianceService,
    private readonly reviews: ReviewsService,
    @Inject(EMAIL_PORT) private readonly email: EmailPort,
  ) {}

  async create(body: z.infer<typeof TakedownCreateBody>, meta: RequestMeta) {
    await this.rateLimit.enforce(`takedown:ip:${meta.ipPrefix ?? meta.ip}`, 5, 3600);
    const r = await this.insert(body, 'WEB_FORM', null, new Date());
    await this.notifyReceived(r);
    return { accepted: true as const, reference: reference(r.id), dueAt: r.dueAt.toISOString() };
  }

  async createManual(
    ctx: AuthContext,
    body: z.infer<typeof AdminTakedownCreateBody>,
    meta: RequestMeta,
  ) {
    const receivedAt = body.receivedAt ? new Date(body.receivedAt) : new Date();
    const r = await this.prisma.$transaction(async (tx) => {
      const created = await this.insert(
        body,
        'MANUAL',
        body.authorityReference ?? null,
        receivedAt,
        tx,
      );
      await this.record(tx, ctx, 'legal.takedown.created', created.id, meta, { kind: body.kind });
      return created;
    });
    await this.notifyReceived(r);
    return this.dto(r);
  }

  async list(now = new Date()) {
    const rows = await this.prisma.takedownRequest.findMany({
      where: { status: { in: ['RECEIVED', 'IN_REVIEW'] } },
      orderBy: { dueAt: 'asc' },
      take: 200,
    });
    const data = rows.map((r) => this.dto(r, now));
    return { data, overdue: data.filter((d) => d.alert === 'OVERDUE').length };
  }

  async update(ctx: AuthContext, id: string, body: TakedownUpdateBody, meta: RequestMeta) {
    const r = await this.prisma.takedownRequest.findUnique({ where: { id } });
    if (!r) throw notFound();
    if (['ACTIONED', 'REJECTED', 'WITHDRAWN'].includes(r.status)) {
      throw new ProblemException(HttpStatus.CONFLICT, 'CONFLICT', 'Talep zaten sonuçlandı');
    }
    if (r.version !== body.version) {
      throw new ProblemException(
        HttpStatus.PRECONDITION_FAILED,
        'PRECONDITION_FAILED',
        'Talep değişti',
      );
    }
    const decided = body.status === 'ACTIONED' || body.status === 'REJECTED';
    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      if (body.removeTarget) {
        const review = await tx.review.findUnique({ where: { id: body.targetId! } });
        if (!review) {
          throw new ProblemException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'VALIDATION_FAILED',
            'Hedef değerlendirme bulunamadı',
            undefined,
            [{ pointer: '/targetId', code: 'unknown_review', message: 'Değerlendirme bulunamadı' }],
          );
        }
        if (review.status === 'PUBLISHED' || review.status === 'PENDING') {
          const removed = await tx.review.update({
            where: { id: review.id },
            data: {
              status: 'REMOVED',
              reasonCode: ORDER.has(r.kind) ? 'COURT_ORDER' : 'LEGAL_REQUEST',
              reasonNote: `Hukuki talep ${reference(r.id)}`,
              moderatedById: ctx.userId,
              moderatedAt: now,
              version: { increment: 1 },
            },
          });
          await this.reviews.changed(tx, removed, review.status);
        }
      }
      const u = await tx.takedownRequest.update({
        where: { id },
        data: {
          status: body.status,
          ...(body.targetType ? { targetType: body.targetType } : {}),
          ...(body.targetId ? { targetId: body.targetId } : {}),
          rejectionReason: body.status === 'REJECTED' ? body.rejectionReason! : null,
          decisionNote: body.decisionNote ?? null,
          ...(decided ? { decidedAt: now, decidedById: ctx.userId } : {}),
          version: { increment: 1 },
        },
      });
      await this.record(tx, ctx, `legal.takedown.${body.status.toLowerCase()}`, id, meta, {
        kind: r.kind,
        removedReview: body.removeTarget ? body.targetId! : null,
      });
      return u;
    });
    if (decided) {
      await this.email.send({
        to: r.requesterEmail,
        ...takedownEmails.decided(
          reference(r.id),
          body.status === 'ACTIONED',
          body.rejectionReason ? T.rejections[body.rejectionReason] : null,
          body.decisionNote ?? null,
        ),
        category: 'transactional',
      });
    }
    return this.dto(updated);
  }

  private async insert(
    body: z.infer<typeof TakedownCreateBody> | z.infer<typeof AdminTakedownCreateBody>,
    channel: 'WEB_FORM' | 'MANUAL',
    authorityReference: string | null,
    receivedAt: Date,
    tx: Pick<PrismaService, 'takedownRequest'> = this.prisma,
  ) {
    const hours = (await this.compliance.get()).takedownResponseHours[body.kind as TakedownKind];
    return tx.takedownRequest.create({
      data: {
        kind: body.kind,
        channel,
        requesterName: body.requesterName,
        requesterOrg: body.requesterOrg ?? null,
        requesterEmail: body.requesterEmail,
        requesterCapacity: body.requesterCapacity,
        legalBasis: body.legalBasis,
        authorityReference,
        targetUrl: body.targetUrl,
        documentsNote: body.documentsNote ?? null,
        receivedAt,
        dueAt: new Date(receivedAt.getTime() + hours * HOUR),
      },
    });
  }

  private notifyReceived(r: TakedownRequest) {
    return this.email.send({
      to: r.requesterEmail,
      ...takedownEmails.received(reference(r.id), formatLongDate(r.dueAt)),
      category: 'transactional',
    });
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
        targetType: 'takedown_request',
        targetId,
        summary,
        ipPrefix: meta.ipPrefix,
        traceId: meta.traceId,
      },
      tx,
    );
  }

  private dto(r: TakedownRequest, now = new Date()): AdminTakedown {
    return {
      id: r.id,
      kind: r.kind,
      channel: r.channel as 'WEB_FORM',
      requesterName: r.requesterName,
      requesterOrg: r.requesterOrg,
      requesterEmail: r.requesterEmail,
      requesterCapacity: r.requesterCapacity as AdminTakedown['requesterCapacity'],
      legalBasis: r.legalBasis,
      authorityReference: r.authorityReference,
      targetUrl: r.targetUrl,
      targetType: r.targetType as AdminTakedown['targetType'],
      targetId: r.targetId,
      documentsNote: r.documentsNote,
      status: r.status,
      receivedAt: r.receivedAt.toISOString(),
      dueAt: r.dueAt.toISOString(),
      hoursLeft: Math.round(((r.dueAt.getTime() - now.getTime()) / HOUR) * 10) / 10,
      alert: takedownAlert(r, now),
      decidedAt: r.decidedAt?.toISOString() ?? null,
      rejectionReason: r.rejectionReason as AdminTakedown['rejectionReason'],
      decisionNote: r.decisionNote,
      version: r.version,
    };
  }
}

const ORDER: ReadonlySet<string> = new Set(['COURT_ORDER', 'ADMINISTRATIVE_ORDER']);
