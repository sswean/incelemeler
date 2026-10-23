import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AdminVerdictState, Problem, PublicListing } from '@incelemeler/contracts';
import { seedDemoListings } from '../src/seed/demo-listings.js';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { nextIp, staffToken } from './staff.js';

let t: TestContext;
let editor: string;
let editor2: string;
let sales: string;
let author: string;
let listing: { id: string; slug: string };
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}`, 'X-Forwarded-For': nextIp() });
const path = () => `/v1/admin/listings/${listing.id}/verdict`;
const VERDICT = {
  baseVersion: 0,
  experienceType: 'VISITED',
  experienceNote: 'Hafta içi akşam yemeği, iki kişi',
  testedAt: '2026-09-12',
  score: 8.5,
  criteria: [
    { name: 'Lezzet', score: 9, weight: 2 },
    { name: 'Hizmet', score: 7.5, weight: 1 },
  ],
  pros: ['Taze balık', 'Deniz manzarası'],
  cons: ['Hafta sonu kalabalık'],
  summary: 'Taze ürün ve dikkatli servis; fiyatına göre tutarlı bir deniz restoranı.',
  articleId: null,
};
const save = (body: Record<string, unknown>, token = editor) =>
  http().put(path()).set(as(token)).send(body);
const errorCode = (res: request.Response) => Problem.parse(res.body).errors?.[0]?.code;

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  await seedDemoListings(t.prisma);
  listing = await t.prisma.listing.findFirstOrThrow({
    where: { status: 'PUBLISHED', kind: 'PLACE' },
    orderBy: { slug: 'desc' },
  });
  editor = await staffToken(t, 'verdict-editor@example.com', ['EDITOR']);
  editor2 = await staffToken(t, 'verdict-editor2@example.com', ['EDITOR']);
  sales = await staffToken(t, 'verdict-satis@example.com', ['SALES']);
  author = await staffToken(t, 'verdict-yazar@example.com', ['AUTHOR']);
}, 120_000);

afterAll(async () => {
  await t?.close();
});

describe('editör değerlendirmeleri (REQ-VER-005)', () => {
  it('[REQ-VER-005] [REQ-ICR-007] kurallar: 0,5 adımlı puan; derlemede puan yok; deneyimde puan zorunlu; satış ve yazar erişemez', async () => {
    expect(errorCode(await save({ ...VERDICT, score: 8.3 }).expect(422))).toBeDefined();
    await save({ ...VERDICT, score: 10.5 }).expect(422);
    await save({ ...VERDICT, experienceType: 'RESEARCH_ONLY' }).expect(422);
    await save({ ...VERDICT, score: null }).expect(422);
    await save({ ...VERDICT, criteria: [VERDICT.criteria[0], VERDICT.criteria[0]] }).expect(422);
    // Editoryal bağımsızlık: satış personeli yayından önce göremez ve yazamaz (REQ-GUN-012).
    await http().get(path()).set(as(sales)).expect(403);
    await save(VERDICT, sales).expect(403);
    await save(VERDICT, author).expect(403);
    // Veritabanı da derlemede puanı ve adım dışı puanı reddeder.
    const user = await t.prisma.user.findUniqueOrThrow({
      where: { email: 'verdict-editor@example.com' },
    });
    const raw = (experience: string, score: number | null) =>
      t.prisma.$executeRawUnsafe(
        `INSERT INTO editorial_verdicts (id, listing_id, version, is_current, experience_type, score, summary, author_id)
         VALUES (gen_random_uuid(), $1::uuid, 99, false, $2::"ExperienceType", $3, 'x', $4::uuid)`,
        listing.id,
        experience,
        score,
        user.id,
      );
    await expect(raw('RESEARCH_ONLY', 7)).rejects.toThrow();
    await expect(raw('VISITED', 7.3)).rejects.toThrow();
  });

  it('[REQ-VER-005] [REQ-VER-004] sürümleme ve yayın: taslak görünmez; yayımlanan en son sürüm, kullanıcı puanından ayrı alanda', async () => {
    const v1 = AdminVerdictState.parse((await save(VERDICT).expect(200)).body);
    expect(v1.current).toMatchObject({ version: 1, score: 8.5, publishedAt: null });
    const draft = PublicListing.parse((await http().get(`/v1/listings/${listing.slug}`)).body);
    expect(draft.editorialVerdict).toBeNull();

    await http().post(`${path()}/publish`).set(as(editor)).send({ version: 1 }).expect(200);
    // Eşzamanlı düzenleme: eski taban sürümle kayıt çakışır.
    const v2 = AdminVerdictState.parse(
      (await save({ ...VERDICT, baseVersion: 1, score: 8 }, editor2).expect(200)).body,
    );
    expect(v2.current).toMatchObject({ version: 2, publishedAt: null });
    expect(v2.published).toMatchObject({ version: 1 });
    expect(Problem.parse((await save({ ...VERDICT, baseVersion: 1 }).expect(412)).body).code).toBe(
      'PRECONDITION_FAILED',
    );

    // Yeni taslak yayımlanana dek herkese açık sayfada sürüm 1 kalır.
    const pub = PublicListing.parse((await http().get(`/v1/listings/${listing.slug}`)).body);
    expect(pub.editorialVerdict).toMatchObject({
      version: 1,
      score: 8.5,
      experienceType: 'VISITED',
      testedAt: '2026-09-12',
      criteria: VERDICT.criteria,
    });
    // Editör puanı ile kullanıcı puanını birleştiren alan yok (REQ-VER-004).
    expect(Object.keys(pub).filter((k) => /overall|combined|genel/i.test(k))).toEqual([]);

    // Eski sürüm yayımlanamaz; yayımlanan sürümün içeriği değiştirilemez (tetikleyici).
    await http().post(`${path()}/publish`).set(as(editor)).send({ version: 1 }).expect(409);
    await expect(
      t.prisma.editorialVerdict.updateMany({
        where: { listingId: listing.id, version: 1 },
        data: { summary: 'Sessizce değiştirilmiş özet metni.' },
      }),
    ).rejects.toThrow();
    await http().post(`${path()}/publish`).set(as(editor)).send({ version: 2 }).expect(200);
    const after = PublicListing.parse((await http().get(`/v1/listings/${listing.slug}`)).body);
    expect(after.editorialVerdict).toMatchObject({ version: 2, score: 8 });
    expect(
      await t.prisma.auditLog.count({
        where: { action: { in: ['editorial.verdict.saved', 'editorial.verdict.published'] } },
      }),
    ).toBe(4);
    // Satış personeli yayımlanmış değerlendirmeyi herkese açık sayfada görür; panel kaydına yine erişemez.
    await http().get(path()).set(as(sales)).expect(403);
  });

  it('[REQ-SPN-007] sponsorlu içeriğe editör değerlendirmesi bağlanamaz', async () => {
    const owner = await t.prisma.user.findUniqueOrThrow({
      where: { email: 'verdict-editor@example.com' },
    });
    const sponsored = await t.prisma.article.create({
      data: {
        type: 'SPONSORED',
        slug: 'sponsorlu-deneme-icerigi',
        title: 'Sponsorlu deneme içeriği',
        commercialRelation: 'SPONSORED',
        authorId: owner.id,
      },
    });
    const state = AdminVerdictState.parse((await http().get(path()).set(as(editor))).body);
    const res = await save({
      ...VERDICT,
      baseVersion: state.current!.version,
      articleId: sponsored.id,
    }).expect(422);
    expect(errorCode(res)).toBe('sponsored_article');
  });
});
