import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ModerationQueue,
  MyReview,
  MyReviewList,
  Problem,
  ReviewList,
  SearchResponse,
} from '@incelemeler/contracts';
import { OutboxService } from '../src/modules/outbox/outbox.service.js';
import { SearchIndexerService } from '../src/modules/search/search-indexer.service.js';
import { seedDemoListings } from '../src/seed/demo-listings.js';
import { seedSearchDefaults } from '../src/seed/seed-search.js';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { memberToken, nextIp, staffToken } from './staff.js';

let t: TestContext;
let listingId: string;
let lodgingId: string;
let moderator: string;
let moderator2: string;
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}`, 'X-Forwarded-For': nextIp() });
const codes = (body: unknown) => Problem.parse(body).errors?.map((e) => e.code);
const BODY =
  'Serpme kahvaltı bol ve tazeydi; çay sürekli tazelendi. Hafta sonu kalabalık ama servis hızlıydı.';
const decl = { ownExperience: true, noConflict: true, incentivized: false };
/** Her üyeye özgün metin (aynı metin yinelenen içerik sinyali üretir — doğru davranış). */
const TEXTS = [
  'Gevrek ve boyoz çok tazeydi, kahvaltı tabağı doyurucu; garsonlar güler yüzlü ve hızlıydı.',
  'Fiyatına göre ortalama bir kahvaltı; peynir çeşitleri az, çay ise sürekli tazelendi.',
  'Menü sınırlı ama yumurtalar iyi pişmişti; deniz manzarası güzel, servis biraz yavaştı.',
];
const runOutbox = () => t.app.get(OutboxService).runOnce(200);

function review(token: string, extra: Record<string, unknown> = {}, id = listingId) {
  return http()
    .post('/v1/reviews')
    .set(as(token))
    .send({
      listingId: id,
      rating: 4,
      body: BODY,
      experienceMonth: '2026-09',
      declarations: decl,
      ...extra,
    });
}
/** Güvenilir üye: yeterli onaylı geçmiş (son moderasyon yolu). */
async function trustedMember(email: string) {
  const m = await memberToken(t, email);
  const others = await t.prisma.listing.findMany({
    where: { kind: 'PLACE', id: { not: listingId } },
    take: 3,
  });
  for (const [i, l] of others.entries()) {
    await t.prisma.review.create({
      data: {
        listingId: l.id,
        userId: m.userId,
        rating: 5,
        body: `${email} geçmişi #${i}: ${['Müzeye yakın sakin bir yer, fiyatlar makul ve personel ilgiliydi.', 'Akşam yemeği için gittik; porsiyonlar küçük ama lezzetliydi, rezervasyon şart.', 'Bahçesi geniş, çocuklar için oyun alanı var; hafta içi daha sakin oluyor.'][i]}`,
        incentivized: false,
        declaredAt: new Date(),
        status: 'PUBLISHED',
        moderationMode: 'PRE',
        publishedAt: new Date(Date.now() - 30 * 86_400_000),
      },
    });
  }
  return m;
}
const queue = async (token: string, q: string) =>
  ModerationQueue.parse(
    (await http().get('/v1/admin/moderation/queue').query({ queue: q }).set(as(token)).expect(200))
      .body,
  );
const list = async (query: Record<string, string> = {}) =>
  ReviewList.parse(
    (await http().get(`/v1/listings/${listingId}/reviews`).query(query).expect(200)).body,
  );

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  await seedSearchDefaults(t.prisma);
  await seedDemoListings(t.prisma);
  await t.app.get(SearchIndexerService).reindexAll();
  listingId = (
    await t.prisma.listing.findUniqueOrThrow({ where: { slug: 'ornek-kordon-kahvalticisi-demo' } })
  ).id;
  lodgingId = (
    await t.prisma.listing.findUniqueOrThrow({
      where: { slug: 'ornek-konyaalti-sahil-oteli-demo' },
    })
  ).id;
  moderator = await staffToken(t, 'moderator1@example.com', ['MODERATOR']);
  moderator2 = await staffToken(t, 'moderator2@example.com', ['MODERATOR']);
}, 120_000);

afterAll(async () => {
  await t?.close();
});

describe('değerlendirme yazma ve moderasyon (Ek A6.4, REQ-DEG-004, E2E-004)', () => {
  let first: MyReview;

  it('[REQ-DEG-004] doğrulanmamış e-posta yazamaz; beyanlar önceden işaretli olamaz; tür kuralları', async () => {
    const unverified = await memberToken(t, 'dogrulanmamis@example.com', { verified: false });
    expect((await review(unverified.token).expect(403)).body.code).toBe('EMAIL_NOT_VERIFIED');
    const m = await memberToken(t, 'kurallar@example.com');
    // Beyan eksik → 422 (zod)
    await review(m.token, {
      declarations: { ownExperience: false, noConflict: true, incentivized: false },
    }).expect(422);
    await review(m.token, { declarations: { ownExperience: true, noConflict: true } }).expect(422);
    await review(m.token, { body: 'Kısa' }).expect(422);
    expect(codes((await review(m.token, { experienceMonth: null }).expect(422)).body)).toEqual([
      'required',
    ]);
    expect(codes((await review(m.token, { experienceMonth: '2099-01' }).expect(422)).body)).toEqual(
      ['future'],
    );
    // Konaklamada yolculuk türü zorunlu (A6.3).
    expect(codes((await review(m.token, {}, lodgingId).expect(422)).body)).toEqual(['required']);
  });

  it('[REQ-DEG-004] [REQ-GUN-001] yeni üyenin değerlendirmesi incelemede; kuyrukta; onaylanınca yayında ve e-posta', async () => {
    const m = await memberToken(t, 'yeni-uye@example.com', { displayName: 'Yeni Üye' });
    first = MyReview.parse((await review(m.token).expect(201)).body);
    expect(first).toMatchObject({ status: 'PENDING', appeal: 'NONE' });
    // Tek aktif değerlendirme.
    expect(codes((await review(m.token).expect(409)).body)).toEqual(['review_exists']);
    await runOutbox();
    expect(t.mail.sent.at(-1)).toMatchObject({
      to: 'yeni-uye@example.com',
      subject: 'Değerlendirmen incelemede',
    });
    expect((await list()).data).toHaveLength(0);

    const q = await queue(moderator, 'pending');
    const item = q.data.find((i) => i.id === first.id)!;
    expect(item.review.signals.map((s) => s.code)).toContain('FEW_APPROVED');
    // Ret/kaldırmada gerekçe zorunlu.
    await http()
      .post(`/v1/admin/moderation/reviews/${first.id}/decision`)
      .set(as(moderator))
      .send({ action: 'REJECT', version: first.version })
      .expect(422);
    await http()
      .post(`/v1/admin/moderation/reviews/${first.id}/decision`)
      .set(as(moderator))
      .send({ action: 'APPROVE', version: first.version })
      .expect(200);
    await runOutbox();
    expect(t.mail.sent.at(-1)).toMatchObject({ subject: 'Değerlendirmen yayında' });
    const l = await list();
    expect(l.data.map((r) => r.author.displayName)).toEqual(['Yeni Üye']);
    // n = 1: ortalama gösterilmez (A6.2).
    expect(l.summary).toMatchObject({ count: 1, display: 'insufficient', average: null });
    const audit = await t.prisma.auditLog.findFirst({
      where: { action: 'moderation.review.approve' },
    });
    expect(audit?.targetId).toBe(first.id);
  });

  it('[REQ-DEG-001] [REQ-VER-007] n ≥ 3 ortalama; teşvikli beyan etiketli yayımlanır ama ortalamaya girmez; aramaya yansır', async () => {
    for (const [i, rating] of [5, 3].entries()) {
      const m = await trustedMember(`guvenilir-${i}@example.com`);
      const r = MyReview.parse(
        (await review(m.token, { rating, body: TEXTS[i]! }).expect(201)).body,
      );
      expect(r.status).toBe('PUBLISHED'); // son moderasyon
    }
    const inc = await trustedMember('tesvikli@example.com');
    const r = MyReview.parse(
      (
        await review(inc.token, {
          rating: 1,
          body: TEXTS[2],
          declarations: { ...decl, incentivized: true },
        }).expect(201)
      ).body,
    );
    expect(r).toMatchObject({ status: 'PUBLISHED', incentivized: true });
    await runOutbox();
    const l = await list();
    expect(l.total).toBe(4);
    expect(l.data.find((x) => x.incentivized)?.rating).toBe(1);
    expect(l.summary).toMatchObject({
      count: 3,
      display: 'average',
      average: 4,
      distribution: null,
    });
    // Varsayılan "en yeni"; en düşük puan sıralaması olumsuzları gizlemez.
    expect((await list({ sort: 'lowest' })).data[0]!.rating).toBe(1);
    const stats = await t.prisma.listingRatingStats.findUniqueOrThrow({ where: { listingId } });
    expect(Number(stats.bayes)).toBeCloseTo((10 * Number(stats.prior) + 12) / 13, 2);
    const search = SearchResponse.parse(
      (await http().get('/v1/search').query({ q: 'kordon kahvaltıcısı' }).expect(200)).body,
    );
    expect(search.data[0]).toMatchObject({
      title: 'Örnek Kordon Kahvaltıcısı (Demo)',
      ratingCount: 3,
    });
    // Son moderasyon kuyruğunda inceleme bekleyen yayındaki değerlendirmeler.
    expect((await queue(moderator, 'post')).data.length).toBeGreaterThanOrEqual(3);
  });

  it('[REQ-GUN-001] kişisel veri içeren metin güvenilir hesapta da ön moderasyona düşer', async () => {
    const m = await trustedMember('kisisel-veri@example.com');
    const r = MyReview.parse(
      (
        await review(m.token, {
          body: `${BODY} Sahibine 0532 111 22 33 numarasından ulaşabilirsiniz.`,
        }).expect(201)
      ).body,
    );
    expect(r.status).toBe('PENDING');
  });

  it('[REQ-GUN-002] [REQ-GUN-003] [REQ-GUN-009] ret → yeniden gönderim; kaldırma → itiraz; farklı moderatör karar verir', async () => {
    const owner = await memberToken(t, 'itiraz-sahibi@example.com');
    let r = MyReview.parse(
      (
        await review(owner.token, {}, lodgingId)
          .set(as(owner.token))
          .send({
            listingId: lodgingId,
            rating: 2,
            body: BODY,
            experienceMonth: '2026-08',
            visitContext: 'FAMILY',
            declarations: decl,
          })
          .expect(201)
      ).body,
    );
    await http()
      .post(`/v1/admin/moderation/reviews/${r.id}/decision`)
      .set(as(moderator))
      .send({
        action: 'REJECT',
        reasonCode: 'PERSONAL_DATA',
        note: 'Telefon numarası var',
        version: r.version,
      })
      .expect(200);
    await runOutbox();
    expect(t.mail.sent.at(-1)!.text).toContain('Kişisel veri içeriyor');
    let mine = MyReviewList.parse(
      (await http().get('/v1/me/reviews').set(as(owner.token)).expect(200)).body,
    );
    r = mine.data.find((x) => x.id === r.id)!;
    expect(r).toMatchObject({
      status: 'REJECTED',
      reasonCode: 'PERSONAL_DATA',
      appeal: 'AVAILABLE',
    });
    // Düzenle ve yeniden gönder → incelemede; revizyon saklanır.
    r = MyReview.parse(
      (
        await http()
          .patch(`/v1/reviews/${r.id}`)
          .set(as(owner.token))
          .send({
            rating: 2,
            body: BODY,
            experienceMonth: '2026-08',
            visitContext: 'FAMILY',
            declarations: decl,
            version: r.version,
          })
          .expect(200)
      ).body,
    );
    expect(r.status).toBe('PENDING');
    expect(await t.prisma.reviewRevision.count({ where: { reviewId: r.id } })).toBe(1);
    await http()
      .post(`/v1/admin/moderation/reviews/${r.id}/decision`)
      .set(as(moderator))
      .send({ action: 'APPROVE', version: r.version })
      .expect(200);

    // Misafir bildirir (hız sınırlı, e-postasıyla); bildirim karar verilene kadar yayında kalır.
    const report = await http()
      .post('/v1/reports')
      .set('X-Forwarded-For', nextIp())
      .send({
        targetType: 'REVIEW',
        targetId: r.id,
        reason: 'HATE_OR_HARASSMENT',
        email: 'misafir@example.com',
      })
      .expect(201);
    mine = MyReviewList.parse(
      (await http().get('/v1/me/reviews').set(as(owner.token)).expect(200)).body,
    );
    expect(mine.data.find((x) => x.id === r.id)).toMatchObject({
      status: 'PUBLISHED',
      reported: true,
    });
    const reports = await queue(moderator, 'reports');
    expect(reports.data.find((i) => i.review.id === r.id)?.report).toMatchObject({ count: 1 });
    // Moderatör 1 kaldırır (gerekçe kodu).
    await http()
      .post(`/v1/admin/moderation/reports/${report.body.id}/decision`)
      .set(as(moderator))
      .send({ action: 'REMOVE_TARGET', reasonCode: 'HATE_OR_HARASSMENT' })
      .expect(200);
    await runOutbox();
    expect(
      t.mail.sent.some(
        (m) => m.to === 'misafir@example.com' && m.subject === 'Bildirimin sonuçlandı',
      ),
    ).toBe(true);
    expect(
      (await t.prisma.contentReport.findUniqueOrThrow({ where: { id: report.body.id } }))
        .reporterEmail,
    ).toBeNull();

    // Sahip itiraz eder (bir kez); aynı moderatör karar veremez, farklı moderatör kabul eder.
    const appeal = await http()
      .post('/v1/appeals')
      .set(as(owner.token))
      .send({ reviewId: r.id, statement: 'Değerlendirmemde hakaret yok; deneyimimi anlattım.' })
      .expect(201);
    await http()
      .post('/v1/appeals')
      .set(as(owner.token))
      .send({ reviewId: r.id, statement: 'İkinci itiraz denemesi yapıyorum burada.' })
      .expect(409);
    expect((await queue(moderator2, 'appeals')).data.map((i) => i.id)).toContain(appeal.body.id);
    const same = await http()
      .post(`/v1/admin/moderation/appeals/${appeal.body.id}/decision`)
      .set(as(moderator))
      .send({ outcome: 'OVERTURNED', note: 'Yeniden incelendi' })
      .expect(403);
    expect(codes(same.body)).toEqual(['same_moderator']);
    await http()
      .post(`/v1/admin/moderation/appeals/${appeal.body.id}/decision`)
      .set(as(moderator2))
      .send({ outcome: 'OVERTURNED', note: 'Hakaret içermiyor; yeniden yayımlandı.' })
      .expect(200);
    await runOutbox();
    mine = MyReviewList.parse(
      (await http().get('/v1/me/reviews').set(as(owner.token)).expect(200)).body,
    );
    expect(mine.data.find((x) => x.id === r.id)).toMatchObject({
      status: 'PUBLISHED',
      appeal: 'OVERTURNED',
    });
    expect(t.mail.sent.at(-1)).toMatchObject({
      to: 'itiraz-sahibi@example.com',
      subject: 'İtirazın sonuçlandı',
    });
  });

  it('[REQ-GUN-004] [REQ-GUN-009] "işletme beğenmedi" gerekçe kodu yok; moderatör kendi değerlendirmesini modere edemez', async () => {
    const staffMember = await t.prisma.user.findUniqueOrThrow({
      where: { email: 'moderator1@example.com' },
    });
    const own = await t.prisma.review.create({
      data: {
        listingId: lodgingId,
        userId: staffMember.id,
        rating: 5,
        body: BODY,
        incentivized: false,
        declaredAt: new Date(),
        status: 'PENDING',
        moderationMode: 'PRE',
      },
    });
    const res = await http()
      .post(`/v1/admin/moderation/reviews/${own.id}/decision`)
      .set(as(moderator))
      .send({ action: 'APPROVE', version: own.version })
      .expect(403);
    expect(codes(res.body)).toEqual(['conflict_of_interest']);
    await http()
      .post(`/v1/admin/moderation/reviews/${own.id}/decision`)
      .set(as(moderator2))
      .send({ action: 'REMOVE', reasonCode: 'BUSINESS_DISLIKED', version: own.version })
      .expect(422);
    // Yetkisiz rol kuyruğa erişemez.
    const editor = await staffToken(t, 'editor-mod@example.com', ['EDITOR']);
    await http().get('/v1/admin/moderation/queue').set(as(editor)).expect(403);
  });

  it('[REQ-DEG-004] üye taslağı hesapta saklanır; gönderimde silinir; geri çekme', async () => {
    const m = await memberToken(t, 'taslak@example.com');
    const target = (
      await t.prisma.listing.findUniqueOrThrow({ where: { slug: 'ornek-moda-ocakbasi-demo' } })
    ).id;
    await http().get(`/v1/me/review-drafts/${target}`).set(as(m.token)).expect(404);
    await http()
      .put(`/v1/me/review-drafts/${target}`)
      .set(as(m.token))
      .send({ data: { rating: 4, body: 'Yarım kalan metin' } })
      .expect(200);
    const d = await http().get(`/v1/me/review-drafts/${target}`).set(as(m.token)).expect(200);
    expect(d.body.data).toEqual({ rating: 4, body: 'Yarım kalan metin' });
    const r = MyReview.parse((await review(m.token, {}, target).expect(201)).body);
    await http().get(`/v1/me/review-drafts/${target}`).set(as(m.token)).expect(404);
    const w = MyReview.parse(
      (await http().delete(`/v1/reviews/${r.id}`).set(as(m.token)).expect(200)).body,
    );
    expect(w.status).toBe('WITHDRAWN');
    // Geri çekildikten sonra yeniden yazılabilir (tek AKTİF kural).
    await review(m.token, {}, target).expect(201);
  });
});
