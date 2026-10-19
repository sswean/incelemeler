import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AdminTakedown, AdminTakedownList, Problem, TakedownAck } from '@incelemeler/contracts';
import { OutboxService } from '../src/modules/outbox/outbox.service.js';
import { seedDemoListings } from '../src/seed/demo-listings.js';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { memberToken, nextIp, staffToken } from './staff.js';

let t: TestContext;
let admin: string;
let moderator: string;
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}`, 'X-Forwarded-For': nextIp() });
const HOUR = 3_600_000;
const base = {
  requesterName: 'Av. Deniz Ak',
  requesterEmail: 'deniz@hukuk.example',
  requesterCapacity: 'REPRESENTATIVE',
  legalBasis:
    'Müvekkilin adı ve fotoğrafı izinsiz kullanılmıştır; ilgili içeriğin kaldırılmasını talep ederiz.',
  targetUrl: 'https://incelemeler.example/degerlendirmeler/ornek',
};
const list = async () =>
  AdminTakedownList.parse(
    (await http().get('/v1/admin/takedown-requests').set(as(admin)).expect(200)).body,
  );

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  await seedDemoListings(t.prisma);
  admin = await staffToken(t, 'hukuk-yonetici@example.com', ['ADMIN']);
  moderator = await staffToken(t, 'hukuk-moderator@example.com', ['MODERATOR']);
}, 120_000);

afterAll(async () => {
  await t?.close();
});

describe('hukuki talepler (REQ-GUN-005)', () => {
  it('[REQ-GUN-005] herkese açık form: tür başına yanıt süresi, alındı e-postası; resmî kararlar bu kanaldan alınmaz', async () => {
    const ack = TakedownAck.parse(
      (
        await http()
          .post('/v1/takedown-requests')
          .set('X-Forwarded-For', nextIp())
          .send({ ...base, kind: 'PERSONALITY_RIGHTS', goodFaithAck: true })
          .expect(202)
      ).body,
    );
    expect(ack.reference).toMatch(/^HT-[0-9A-F]{8}$/);
    const row = await t.prisma.takedownRequest.findFirstOrThrow();
    expect(row.dueAt.getTime() - row.receivedAt.getTime()).toBe(24 * HOUR);
    expect(t.mail.sent.at(-1)).toMatchObject({ to: 'deniz@hukuk.example' });
    expect(t.mail.sent.at(-1)!.subject).toContain(ack.reference);
    await http()
      .post('/v1/takedown-requests')
      .set('X-Forwarded-For', nextIp())
      .send({ ...base, kind: 'COURT_ORDER', goodFaithAck: true })
      .expect(422);
    await http()
      .post('/v1/takedown-requests')
      .set('X-Forwarded-For', nextIp())
      .send({ ...base, kind: 'COPYRIGHT' })
      .expect(422);
  });

  it('[REQ-GUN-005] resmî karar ayrı akış: yalnızca panel, karar referansıyla; süre uyarıları; yetki yalnızca yöneticide', async () => {
    const create = (body: Record<string, unknown>) =>
      http().post('/v1/admin/takedown-requests').set(as(admin)).send(body);
    await create({ ...base, kind: 'COURT_ORDER', requesterCapacity: 'AUTHORITY' }).expect(422);
    const order = AdminTakedown.parse(
      (
        await create({
          ...base,
          kind: 'COURT_ORDER',
          requesterCapacity: 'AUTHORITY',
          authorityReference: 'İstanbul 5. Sulh Ceza Hâkimliği, 2026/123 D.İş',
          receivedAt: new Date(Date.now() - 23 * HOUR).toISOString(),
        }).expect(201)
      ).body,
    );
    expect(order).toMatchObject({ channel: 'MANUAL', alert: 'DUE_SOON' });
    await create({
      ...base,
      kind: 'COPYRIGHT',
      receivedAt: new Date(Date.now() - 80 * HOUR).toISOString(),
    }).expect(201);
    const l = await list();
    expect(l.overdue).toBe(1);
    expect(l.data[0]!.alert).toBe('OVERDUE');
    await http().get('/v1/admin/takedown-requests').set(as(moderator)).expect(403);
    // Veritabanı da form kanalından resmî kararı reddeder.
    await expect(
      t.prisma.takedownRequest.create({
        data: {
          kind: 'ADMINISTRATIVE_ORDER',
          channel: 'WEB_FORM',
          requesterName: 'x',
          requesterEmail: 'x@example.com',
          requesterCapacity: 'AUTHORITY',
          legalBasis: 'x',
          targetUrl: 'https://x',
          dueAt: new Date(),
        },
      }),
    ).rejects.toThrow();
  });

  it('[REQ-GUN-005] işlem: hedef değerlendirme hukuki gerekçeyle kaldırılır, istatistikten çıkar; ret gerekçeli; talep edene e-posta; denetim kaydı', async () => {
    const listing = await t.prisma.listing.findFirstOrThrow({
      where: { status: 'PUBLISHED', kind: 'PLACE' },
    });
    const author = await memberToken(t, 'hukuki-hedef@example.com');
    const review = await t.prisma.review.create({
      data: {
        listingId: listing.id,
        userId: author.userId,
        rating: 1,
        body: 'İşletme sahibi Ali Veli bey bana kötü davrandı, telefonu 0555 000 00 00.',
        incentivized: false,
        declaredAt: new Date(),
        status: 'PUBLISHED',
        moderationMode: 'PRE',
        publishedAt: new Date(),
      },
    });
    const [personality] = (await list()).data.filter((d) => d.kind === 'PERSONALITY_RIGHTS');
    const patch = (id: string, body: Record<string, unknown>) =>
      http().patch(`/v1/admin/takedown-requests/${id}`).set(as(admin)).send(body);
    const reviewing = AdminTakedown.parse(
      (
        await patch(personality!.id, { version: personality!.version, status: 'IN_REVIEW' }).expect(
          200,
        )
      ).body,
    );
    const done = AdminTakedown.parse(
      (
        await patch(personality!.id, {
          version: reviewing.version,
          status: 'ACTIONED',
          targetType: 'review',
          targetId: review.id,
          removeTarget: true,
          decisionNote: 'Kişisel veri ve kişilik hakkı ihlali nedeniyle kaldırıldı.',
        }).expect(200)
      ).body,
    );
    expect(done).toMatchObject({ status: 'ACTIONED', targetId: review.id });
    expect(await t.prisma.review.findUniqueOrThrow({ where: { id: review.id } })).toMatchObject({
      status: 'REMOVED',
      reasonCode: 'LEGAL_REQUEST',
    });
    await t.app.get(OutboxService).runOnce();
    const decidedMail = [...t.mail.sent].reverse().find((m) => m.to === 'deniz@hukuk.example')!;
    expect(decidedMail.text).toContain('gerekli işlem yapıldı');
    await patch(personality!.id, { version: done.version, status: 'IN_REVIEW' }).expect(409);

    const [copyright] = (await list()).data.filter((d) => d.kind === 'COPYRIGHT');
    expect(
      Problem.parse(
        (
          await patch(copyright!.id, { version: copyright!.version, status: 'REJECTED' }).expect(
            422,
          )
        ).body,
      ).errors?.[0]?.pointer,
    ).toBe('/body/rejectionReason');
    await patch(copyright!.id, {
      version: copyright!.version,
      status: 'REJECTED',
      rejectionReason: 'NOT_OUR_CONTENT',
    }).expect(200);
    const audit = await t.prisma.auditLog.findMany({
      where: { action: { startsWith: 'legal.takedown.' } },
    });
    expect(audit.map((a) => a.action).sort()).toEqual([
      'legal.takedown.actioned',
      'legal.takedown.created',
      'legal.takedown.created',
      'legal.takedown.in_review',
      'legal.takedown.rejected',
    ]);
    expect(JSON.stringify(audit)).not.toMatch(/deniz@|0555/);
  });
});
