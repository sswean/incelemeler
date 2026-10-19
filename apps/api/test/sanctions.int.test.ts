import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AdminSanctionList, Problem, PublicListing, SanctionCreated } from '@incelemeler/contracts';
import { OutboxService } from '../src/modules/outbox/outbox.service.js';
import { SanctionsService } from '../src/modules/reviews/sanctions.service.js';
import { seedDemoListings } from '../src/seed/demo-listings.js';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { memberToken, nextIp, STAFF_PASSWORD, staffToken } from './staff.js';

let t: TestContext;
let modA: string;
let modB: string;
let listingId: string;
let listingSlug: string;
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}`, 'X-Forwarded-For': nextIp() });
const code = (res: request.Response) => Problem.parse(res.body).code;
const appealToken = (to: string) => {
  const m = [...t.mail.sent].reverse().find((x) => x.to === to);
  const match = /belirtec=([A-Za-z0-9_.%-]+)/.exec(m?.text ?? '');
  if (!match?.[1]) throw new Error(`${to} için bağlantı yok`);
  return decodeURIComponent(match[1]);
};
const issue = (token: string, body: Record<string, unknown>) =>
  http()
    .post('/v1/admin/sanctions')
    .set(as(token))
    .send({ reasonCode: 'SPAM', note: 'Tekrarlayan reklam içerikleri.', ...body });
const login = (email: string) =>
  http()
    .post('/v1/auth/login')
    .set('X-Forwarded-For', nextIp())
    .send({ email, password: STAFF_PASSWORD });
const writeReview = (token: string) =>
  http().post('/v1/reviews').set(as(token)).send({ listingId, rating: 4, body: 'x' });

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  await seedDemoListings(t.prisma);
  const l = await t.prisma.listing.findFirstOrThrow({
    where: { status: 'PUBLISHED', kind: 'PLACE' },
    orderBy: { slug: 'asc' },
  });
  listingId = l.id;
  listingSlug = l.slug;
  modA = await staffToken(t, 'yaptirim-mod-a@example.com', ['MODERATOR']);
  modB = await staffToken(t, 'yaptirim-mod-b@example.com', ['MODERATOR']);
}, 120_000);

afterAll(async () => {
  await t?.close();
});

describe('hesap yaptırım basamakları (REQ-GUN-007)', () => {
  it('[REQ-GUN-007] basamak önerisi; atlama gerekçesiz reddedilir; kısıtlama değerlendirme yazmayı engeller', async () => {
    const m = await memberToken(t, 'yaptirim-uye@example.com');
    const warn = SanctionCreated.parse(
      (await issue(modA, { email: 'yaptirim-uye@example.com', level: 'WARNING' }).expect(201)).body,
    );
    expect(warn).toMatchObject({ suggestedLevel: 'WARNING', sanction: { level: 'WARNING' } });
    const mail = [...t.mail.sent].reverse().find((x) => x.to === 'yaptirim-uye@example.com')!;
    expect(mail.text).toContain('Uyarı');
    expect(mail.text).toContain('Reklam ya da istenmeyen içerik');
    expect(mail.text).toMatch(/itiraz\/yaptirim\?belirtec=/);

    const skipped = await issue(modA, {
      email: 'yaptirim-uye@example.com',
      level: 'SUSPENSION',
      durationDays: 7,
    }).expect(422);
    expect(Problem.parse(skipped.body).errors?.[0]?.code).toBe('level_skipped');
    await issue(modA, {
      email: 'yaptirim-uye@example.com',
      level: 'REVIEW_RESTRICTION',
      durationDays: 3,
    }).expect(201);
    expect(code(await writeReview(m.token).expect(403))).toBe('ACCOUNT_RESTRICTED');
    // Personel ve kendisi yaptırılamaz.
    await issue(modA, { email: 'yaptirim-mod-b@example.com', level: 'WARNING' }).expect(403);
    await issue(modA, { email: 'yaptirim-mod-a@example.com', level: 'WARNING' }).expect(403);
  });

  it('[REQ-GUN-007] [REQ-GUN-003] itiraz e-postadaki bağlantıyla bir kez; yaptırımı veren karar veremez; kabulde kısıtlama kalkar', async () => {
    const token = appealToken('yaptirim-uye@example.com');
    await http()
      .post('/v1/sanction-appeals')
      .send({ token, statement: 'Paylaşımlarım reklam değildi, kendi deneyimimdi.' })
      .expect(202);
    await http()
      .post('/v1/sanction-appeals')
      .send({ token, statement: 'İkinci itiraz denemesi yapıyorum.' })
      .expect(409);
    const list = AdminSanctionList.parse(
      (await http().get('/v1/admin/sanctions').set(as(modA)).expect(200)).body,
    );
    const pending = list.appeals[0]!;
    expect(pending).toMatchObject({ level: 'REVIEW_RESTRICTION', appeal: { outcome: null } });
    await http()
      .post(`/v1/admin/sanctions/${pending.id}/appeal-decision`)
      .set(as(modA))
      .send({ version: pending.version, outcome: 'OVERTURNED', note: 'Kendi kararım.' })
      .expect(403);
    await http()
      .post(`/v1/admin/sanctions/${pending.id}/appeal-decision`)
      .set(as(modB))
      .send({
        version: pending.version,
        outcome: 'OVERTURNED',
        note: 'Kanıt yetersiz, kaldırıldı.',
      })
      .expect(200);
    const m = await login('yaptirim-uye@example.com').expect(200);
    const res = await writeReview(m.body.sessionToken as string);
    expect(res.status).not.toBe(403);
    // Veritabanı da itirazı yaptırımı verenin karara bağlamasını reddeder.
    await expect(
      t.prisma.accountSanction.update({
        where: { id: pending.id },
        data: {
          appealDecidedById: (
            await t.prisma.accountSanction.findUniqueOrThrow({ where: { id: pending.id } })
          ).issuedById,
        },
      }),
    ).rejects.toThrow();
  });

  it('[REQ-GUN-007] askı oturumları kapatır ve girişi engeller; süre dolunca giriş açılır; kalıcı kapatma step-up ister', async () => {
    const m = await memberToken(t, 'askiya-alinan@example.com');
    await issue(modA, { email: 'askiya-alinan@example.com', level: 'WARNING' }).expect(201);
    await issue(modA, {
      email: 'askiya-alinan@example.com',
      level: 'SUSPENSION',
      durationDays: 2,
      skipLevel: true,
      note: 'Tehdit içeren mesajlar; ağır ihlal.',
      reasonCode: 'THREAT',
    }).expect(201);
    await http().get('/v1/me').set(as(m.token)).expect(401);
    expect(code(await login('askiya-alinan@example.com').expect(403))).toBe('ACCOUNT_SUSPENDED');
    await t.prisma.accountSanction.updateMany({
      where: { user: { email: 'askiya-alinan@example.com' }, level: 'SUSPENSION' },
      data: { endsAt: new Date(Date.now() - 60_000) },
    });
    await login('askiya-alinan@example.com').expect(200);
    expect(
      (await t.prisma.user.findUniqueOrThrow({ where: { email: 'askiya-alinan@example.com' } }))
        .status,
    ).toBe('ACTIVE');

    await t.prisma.session.updateMany({
      where: { user: { email: 'yaptirim-mod-a@example.com' }, revokedAt: null },
      data: { stepUpAt: new Date(Date.now() - 11 * 60_000) },
    });
    expect(
      code(
        await issue(modA, {
          email: 'askiya-alinan@example.com',
          level: 'PERMANENT_BAN',
          skipLevel: true,
        }).expect(403),
      ),
    ).toBe('STEP_UP_REQUIRED');
    // İşçi: süresi dolan askıları kaldırır.
    await t.prisma.user.update({
      where: { email: 'askiya-alinan@example.com' },
      data: { status: 'SUSPENDED' },
    });
    expect(await t.app.get(SanctionsService).liftExpired()).toBe(1);
    expect(
      await t.prisma.auditLog.count({ where: { action: 'moderation.sanction.issued' } }),
    ).toBeGreaterThanOrEqual(4);
  });

  it('[REQ-GUN-007] toplu sahte değerlendirme: kaldırılır, ortalamadan çıkar, listelemede tarihli bildirim; yazar itiraz edebilir', async () => {
    const authors = await Promise.all(
      [1, 2, 3].map((i) => memberToken(t, `sahte-${i}@example.com`)),
    );
    const reviews = await Promise.all(
      authors.map((a, i) =>
        t.prisma.review.create({
          data: {
            listingId,
            userId: a.userId,
            rating: i === 2 ? 2 : 5,
            body: 'Harika bir yer, kesinlikle tavsiye ederim, her şey mükemmeldi.',
            incentivized: false,
            declaredAt: new Date(),
            status: 'PUBLISHED',
            moderationMode: 'PRE',
            publishedAt: new Date(),
          },
        }),
      ),
    );
    const before = PublicListing.parse(
      (await http().get(`/v1/listings/${listingSlug}`).expect(200)).body,
    );
    expect(before.integrityNotice).toBeNull();
    await http()
      .post(`/v1/admin/listings/${listingId}/review-integrity`)
      .set(as(modA))
      .send({
        reviewIds: [reviews[0]!.id, reviews[1]!.id],
        note: 'Aynı ağdan koordineli beş yıldız.',
      })
      .expect(200);
    await t.app.get(OutboxService).runOnce();
    const statuses = await t.prisma.review.findMany({
      where: { id: { in: reviews.map((r) => r.id) } },
      orderBy: { rating: 'asc' },
    });
    expect(statuses.map((r) => r.status).sort()).toEqual(['PUBLISHED', 'REMOVED', 'REMOVED']);
    const stats = await t.prisma.listingRatingStats.findUniqueOrThrow({ where: { listingId } });
    expect(stats.count).toBe(1);
    const after = PublicListing.parse(
      (await http().get(`/v1/listings/${listingSlug}`).expect(200)).body,
    );
    expect(after.integrityNotice).toMatchObject({ removedCount: 2 });
    // Kaldırılan değerlendirmenin yazarı itiraz edebilir (REQ-GUN-003).
    await http()
      .post('/v1/appeals')
      .set(as(authors[0]!.token))
      .send({ reviewId: reviews[0]!.id, statement: 'Bu değerlendirme benim gerçek deneyimimdi.' })
      .expect(201);
    // Yanlış listelemenin değerlendirmesi reddedilir.
    await http()
      .post(`/v1/admin/listings/${listingId}/review-integrity`)
      .set(as(modA))
      .send({ reviewIds: [reviews[0]!.id], note: 'Tekrar deneme notu.' })
      .expect(422);
  });
});
