import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Prisma } from '../../generated/prisma/client.js';

export interface OutboxEventInput {
  type: string;
  aggregateType: string;
  aggregateId: string;
  /** Kişisel veri içermez: kimlikler ve değişen alan adları. */
  payload?: Prisma.InputJsonValue;
}

export interface OutboxEvent {
  id: string;
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload: unknown;
  attempts: number;
}

/** İşleyiciler idempotent olmalıdır: aynı olay birden fazla kez teslim edilebilir (en az bir kez). */
export type OutboxHandler = (event: OutboxEvent) => Promise<void>;

export const OUTBOX_MAX_ATTEMPTS = 10;
const LEASE_SECONDS = 60;
const BACKOFF_BASE_MS = 5_000;
const BACKOFF_MAX_MS = 60 * 60 * 1000;

export function backoffMs(attempts: number): number {
  return Math.min(BACKOFF_BASE_MS * 2 ** Math.max(0, attempts - 1), BACKOFF_MAX_MS);
}

/** Transactional outbox (REQ-MIM-015, ADR-0010). */
@Injectable()
export class OutboxService {
  private readonly handlers = new Map<string, OutboxHandler[]>();
  private readonly logger = new Logger('Outbox');

  constructor(private readonly prisma: PrismaService) {}

  /** Olayı domain değişikliğiyle AYNI işlem içinde yazar. */
  async enqueue(tx: Prisma.TransactionClient, event: OutboxEventInput): Promise<void> {
    await tx.outboxEvent.create({
      data: {
        type: event.type,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        payload: event.payload ?? {},
      },
    });
  }

  register(type: string, handler: OutboxHandler): void {
    this.handlers.set(type, [...(this.handlers.get(type) ?? []), handler]);
  }

  /**
   * Bekleyen olaylardan en fazla `limit` kadarını kiralar (FOR UPDATE SKIP LOCKED) ve işler.
   * Başarısız olay üstel beklemeyle yeniden denenir; OUTBOX_MAX_ATTEMPTS sonrası ölü mektup olur.
   * Dönüş: işlenmeye çalışılan olay sayısı.
   */
  async runOnce(limit = 50): Promise<number> {
    const claimed = await this.prisma.$queryRaw<
      Array<{
        id: string;
        type: string;
        aggregate_type: string;
        aggregate_id: string;
        payload: unknown;
        attempts: number;
      }>
    >`
      UPDATE outbox_events
         SET available_at = now() + make_interval(secs => ${LEASE_SECONDS}), attempts = attempts + 1
       WHERE id IN (
         SELECT id FROM outbox_events
          WHERE processed_at IS NULL AND dead_at IS NULL AND available_at <= now()
          ORDER BY available_at, id
          LIMIT ${limit}
          FOR UPDATE SKIP LOCKED)
      RETURNING id, type, aggregate_type, aggregate_id, payload, attempts`;

    for (const row of claimed) {
      const event: OutboxEvent = {
        id: row.id,
        type: row.type,
        aggregateType: row.aggregate_type,
        aggregateId: row.aggregate_id,
        payload: row.payload,
        attempts: row.attempts,
      };
      try {
        // Abonesi olmayan olay işlenmiş sayılır (ilgili tüketiciler sonraki dilimlerde eklenir).
        for (const handler of this.handlers.get(event.type) ?? []) await handler(event);
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { processedAt: new Date(), lastError: null },
        });
      } catch (e) {
        const message = (e instanceof Error ? e.message : String(e)).slice(0, 500);
        const dead = event.attempts >= OUTBOX_MAX_ATTEMPTS;
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: dead
            ? { deadAt: new Date(), lastError: message }
            : { availableAt: new Date(Date.now() + backoffMs(event.attempts)), lastError: message },
        });
        this.logger.warn(
          JSON.stringify({
            event: dead ? 'outbox.dead_letter' : 'outbox.retry',
            id: event.id,
            type: event.type,
            attempts: event.attempts,
          }),
        );
      }
    }
    return claimed.length;
  }
}
