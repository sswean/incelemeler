import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { OUTBOX_MAX_ATTEMPTS, OutboxService } from '../src/modules/outbox/outbox.service.js';
import { startTestApp, type TestContext } from './app.js';

let t: TestContext;
let outbox: OutboxService;
const AGG = '00000000-0000-7000-8000-000000000001';

beforeAll(async () => {
  t = await startTestApp();
  outbox = t.app.get(OutboxService);
});

afterAll(async () => {
  await t?.close();
});

beforeEach(async () => {
  await t.prisma.outboxEvent.deleteMany();
});

async function enqueue(type: string) {
  await t.prisma.$transaction((tx) =>
    outbox.enqueue(tx, { type, aggregateType: 'test', aggregateId: AGG }),
  );
}

describe('outbox (REQ-MIM-015)', () => {
  it('[REQ-MIM-015] olay domain işlemiyle birlikte geri alınır', async () => {
    await expect(
      t.prisma.$transaction(async (tx) => {
        await outbox.enqueue(tx, {
          type: 'test.rollback',
          aggregateType: 'test',
          aggregateId: AGG,
        });
        throw new Error('domain hatası');
      }),
    ).rejects.toThrow('domain hatası');
    expect(await t.prisma.outboxEvent.count()).toBe(0);
  });

  it('[REQ-MIM-015] başarılı işleyici olayı işlenmiş işaretler; tekrar teslim edilmez', async () => {
    const seen: string[] = [];
    outbox.register('test.ok', async (e) => {
      seen.push(e.id);
    });
    await enqueue('test.ok');
    expect(await outbox.runOnce()).toBe(1);
    expect(await outbox.runOnce()).toBe(0);
    expect(seen).toHaveLength(1);
    const row = await t.prisma.outboxEvent.findFirstOrThrow();
    expect(row.processedAt).not.toBeNull();
    expect(row.attempts).toBe(1);
  });

  it('[REQ-MIM-015] hata üstel beklemeyle yeniden denenir; sınırdan sonra ölü mektup olur', async () => {
    outbox.register('test.fail', async () => {
      throw new Error('geçici hata');
    });
    await enqueue('test.fail');
    expect(await outbox.runOnce()).toBe(1);
    let row = await t.prisma.outboxEvent.findFirstOrThrow();
    expect(row.lastError).toBe('geçici hata');
    expect(row.availableAt.getTime()).toBeGreaterThan(Date.now());
    expect(await outbox.runOnce()).toBe(0); // bekleme süresi dolmadı

    for (let i = 1; i < OUTBOX_MAX_ATTEMPTS; i++) {
      await t.prisma.outboxEvent.updateMany({ data: { availableAt: new Date(Date.now() - 1000) } });
      expect(await outbox.runOnce()).toBe(1);
    }
    row = await t.prisma.outboxEvent.findFirstOrThrow();
    expect(row.attempts).toBe(OUTBOX_MAX_ATTEMPTS);
    expect(row.deadAt).not.toBeNull();
    expect(row.processedAt).toBeNull();
    await t.prisma.outboxEvent.updateMany({ data: { availableAt: new Date(Date.now() - 1000) } });
    expect(await outbox.runOnce()).toBe(0);
  });

  it('[REQ-MIM-016] eşzamanlı işleyiciler aynı olayı iki kez almaz (SKIP LOCKED)', async () => {
    const counts = new Map<string, number>();
    outbox.register('test.concurrent', async (e) => {
      counts.set(e.id, (counts.get(e.id) ?? 0) + 1);
      await new Promise((r) => setTimeout(r, 20));
    });
    for (let i = 0; i < 20; i++) await enqueue('test.concurrent');
    const results = await Promise.all([outbox.runOnce(10), outbox.runOnce(10), outbox.runOnce(10)]);
    expect(results.reduce((a, b) => a + b, 0)).toBe(20);
    expect([...counts.values()].every((n) => n === 1)).toBe(true);
    expect(counts.size).toBe(20);
  });
});
