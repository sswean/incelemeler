import { HttpStatus, Injectable } from '@nestjs/common';
import type { OpeningHours, OpeningHoursBody } from '@incelemeler/contracts';
import { formatClock, isOpenAt, parseClock } from '@incelemeler/utils';
import { ProblemException } from '../../common/problem.js';
import type { RequestMeta } from '../../common/request-meta.js';
import type {
  ListingOpeningException,
  ListingOpeningHours,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthContext } from '../identity/auth.context.js';
import { AuditService } from '../platform/audit.service.js';

const clock = (v: string, closing = false) => parseClock(v, closing)!;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** Saat kayıtlarından herkese açık/panel DTO'su; "şu an açık" sunucuda (REQ-VER-010). */
export function openingHoursDto(
  l: { timezone: string; hoursVerifiedAt: Date | null },
  weekly: ListingOpeningHours[],
  exceptions: ListingOpeningException[],
  now = new Date(),
): OpeningHours | null {
  if (!weekly.length && !exceptions.length) return null;
  const w = [...weekly]
    .sort((a, b) => a.weekday - b.weekday || a.opensMin - b.opensMin)
    .map((h) => ({ day: h.weekday, opens: h.opensMin, closes: h.closesMin }));
  const ex = exceptions.map((e) => ({
    date: isoDate(e.date),
    closed: e.closed,
    opens: e.opensMin,
    closes: e.closesMin,
  }));
  return {
    timezone: l.timezone,
    weekly: w.map((r) => ({
      day: r.day,
      opens: formatClock(r.opens),
      closes: formatClock(r.closes),
    })),
    exceptions: [...exceptions]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((e) => ({
        date: isoDate(e.date),
        closed: e.closed,
        opens: e.opensMin === null ? null : formatClock(e.opensMin),
        closes: e.closesMin === null ? null : formatClock(e.closesMin),
        note: e.note,
      })),
    verifiedAt: l.hoursVerifiedAt?.toISOString() ?? null,
    openNow: isOpenAt(w, ex, l.timezone, now),
  };
}

/** Çalışma saatleri yönetimi (REQ-VER-010): tümüyle değiştirme, denetim kaydı. */
@Injectable()
export class OpeningHoursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async get(listingId: string): Promise<OpeningHours> {
    const l = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { openingHours: true, openingExceptions: true },
    });
    if (!l) throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Listeleme bulunamadı');
    return (
      openingHoursDto(l, l.openingHours, l.openingExceptions) ?? {
        timezone: l.timezone,
        weekly: [],
        exceptions: [],
        verifiedAt: l.hoursVerifiedAt?.toISOString() ?? null,
        openNow: null,
      }
    );
  }

  async put(ctx: AuthContext, listingId: string, body: OpeningHoursBody, meta: RequestMeta) {
    const l = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!l) throw new ProblemException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Listeleme bulunamadı');
    try {
      new Intl.DateTimeFormat('tr', { timeZone: body.timezone });
    } catch {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'VALIDATION_FAILED',
        'Saat dilimi geçersiz',
        undefined,
        [{ pointer: '/body/timezone', code: 'invalid_timezone', message: 'Saat dilimi geçersiz' }],
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.listingOpeningHours.deleteMany({ where: { listingId } });
      await tx.listingOpeningException.deleteMany({ where: { listingId } });
      if (body.weekly.length) {
        await tx.listingOpeningHours.createMany({
          data: body.weekly.map((r) => ({
            listingId,
            weekday: r.day,
            opensMin: clock(r.opens),
            closesMin: clock(r.closes, true),
          })),
        });
      }
      if (body.exceptions.length) {
        await tx.listingOpeningException.createMany({
          data: body.exceptions.map((e) => ({
            listingId,
            date: new Date(`${e.date}T00:00:00Z`),
            closed: e.closed,
            opensMin: e.opens ? clock(e.opens) : null,
            closesMin: e.closes ? clock(e.closes, true) : null,
            note: e.note ?? null,
          })),
        });
      }
      await tx.listing.update({
        where: { id: listingId },
        data: {
          timezone: body.timezone,
          ...(body.verified ? { hoursVerifiedAt: new Date() } : {}),
          version: { increment: 1 },
        },
      });
      await this.audit.record(
        {
          actorId: ctx.userId,
          actorRole: ctx.roles.join(','),
          action: 'catalog.listing.hours_updated',
          targetType: 'listing',
          targetId: listingId,
          summary: {
            weekly: body.weekly.length,
            exceptions: body.exceptions.length,
            verified: body.verified,
          },
          ipPrefix: meta.ipPrefix,
          traceId: meta.traceId,
        },
        tx,
      );
    });
    return this.get(listingId);
  }
}
