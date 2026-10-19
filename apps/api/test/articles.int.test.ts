import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  AdminArticle,
  AdminArticleList,
  AuthorProfile,
  PreviewLink,
  Problem,
  PublicAuthor,
} from '@incelemeler/contracts';
import { verifyToken } from '../src/common/signed-token.js';
import {
  AdminArticlesService,
  PREVIEW_PURPOSE,
} from '../src/modules/editorial/admin-articles.service.js';
import { startTestApp, type TestContext } from './app.js';
import { staffToken } from './staff.js';

let t: TestContext;
let author: string;
let editor: string;
let admin: string;
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}` });
const codes = (body: unknown) => Problem.parse(body).errors?.map((e) => e.code);
const paragraph = (text: string) => ({ type: 'paragraph', content: [{ text }] });

async function create(token: string, body: Record<string, unknown>) {
  return AdminArticle.parse(
    (await http().post('/v1/admin/articles').set(as(token)).send(body).expect(201)).body,
  );
}
function patch(token: string, a: AdminArticle, body: Record<string, unknown>) {
  return http()
    .patch(`/v1/admin/articles/${a.id}`)
    .set(as(token))
    .send({ version: a.version, ...body });
}
function move(token: string, a: AdminArticle, to: string, extra: Record<string, unknown> = {}) {
  return http()
    .post(`/v1/admin/articles/${a.id}/transition`)
    .set(as(token))
    .send({ version: a.version, to, ...extra });
}
const parse = (res: request.Response) => AdminArticle.parse(res.body);

beforeAll(async () => {
  t = await startTestApp();
  author = await staffToken(t, 'icerik-yazar@example.com', ['AUTHOR']);
  editor = await staffToken(t, 'icerik-editor@example.com', ['EDITOR']);
  admin = await staffToken(t, 'icerik-yonetici@example.com', ['ADMIN']);
});

afterAll(async () => {
  await t?.close();
});

describe('içerik yayın akışı (REQ-ICR-005)', () => {
  let guide: AdminArticle;

  it('[REQ-ICR-005] [REQ-ICR-008] yazar taslak yazar; menfaat beyanı olmadan incelemeye gönderemez', async () => {
    guide = await create(author, { type: 'GUIDE', title: 'Kadıköy gezi rehberi' });
    expect(guide).toMatchObject({ status: 'DRAFT', slug: 'kadikoy-gezi-rehberi' });
    expect(guide.blockers.map((b) => b.code)).toEqual([
      'body_required',
      'interest_declaration_required',
    ]);
    guide = parse(
      await patch(author, guide, {
        body: [{ type: 'heading', level: 2, text: 'Giriş' }, paragraph('Kadıköy çarşısı…')],
        summary: 'Bir günlük rota',
      }).expect(200),
    );
    expect(codes((await move(author, guide, 'IN_REVIEW').expect(422)).body)).toEqual([
      'interest_declaration_required',
    ]);
    guide = parse(await patch(author, guide, { interestDeclared: true }).expect(200));
    guide = parse(await move(author, guide, 'IN_REVIEW').expect(200));
    expect(guide.status).toBe('IN_REVIEW');
  });

  it('[REQ-HSP-009] yazar onaylayamaz/yayımlayamaz; editör onaylar ve yayımlar', async () => {
    await move(author, guide, 'APPROVED').expect(403);
    guide = parse(await move(editor, guide, 'APPROVED').expect(200));
    expect(guide.editor?.displayName).toBeTruthy();
    guide = parse(await move(editor, guide, 'PUBLISHED').expect(200));
    expect(guide.status).toBe('PUBLISHED');
    expect(guide.publishedAt).not.toBeNull();
    await patch(author, guide, { title: 'Yazar değiştiremez', changeNote: 'deneme' }).expect(403);
  });

  it('[REQ-ICR-006] [REQ-VER-015] yayındaki içerikte değişiklik notu zorunlu; yalnızca anlamlı değişiklik "son güncelleme"yi yeniler; revizyon saklanır', async () => {
    expect(codes((await patch(editor, guide, { summary: 'x' }).expect(422)).body)).toEqual([
      'change_note_required',
    ]);
    guide = parse(
      await patch(editor, guide, {
        summary: 'Bir günlük rota.',
        changeNote: 'Yazım düzeltmesi',
      }).expect(200),
    );
    expect(guide.lastSignificantUpdateAt).toBeNull();
    guide = parse(
      await patch(editor, guide, {
        body: [paragraph('Yeni durak eklendi.')],
        significantChange: true,
        changeNote: 'Moda sahili durağı eklendi',
      }).expect(200),
    );
    expect(guide.lastSignificantUpdateAt).not.toBeNull();
    expect(guide.updateNotes.map((n) => n.note)).toEqual(['Moda sahili durağı eklendi']);
    expect(await t.prisma.contentRevision.count({ where: { articleId: guide.id } })).toBe(4);
    await patch(editor, guide, { slug: 'yeni-adres', changeNote: 'x x x' }).expect(422);
  });

  it('[REQ-ICR-009] görünür düzeltme notu denetim kaydına girer', async () => {
    guide = parse(
      await http()
        .post(`/v1/admin/articles/${guide.id}/corrections`)
        .set(as(editor))
        .send({ version: guide.version, note: 'Vapur saati 08.30 olarak düzeltildi.' })
        .expect(200),
    );
    expect(guide.corrections.map((c) => c.note)).toEqual(['Vapur saati 08.30 olarak düzeltildi.']);
    expect(
      await t.prisma.auditLog.count({
        where: { action: 'editorial.article.correction', targetId: guide.id },
      }),
    ).toBe(1);
  });

  it('[REQ-ICR-004] [REQ-ICR-007] liste seçim yöntemi, inceleme deneyim beyanı ister', async () => {
    const list = await create(editor, { type: 'LIST', title: 'Kadıköy’ün en iyi kahvaltıcıları' });
    const l2 = parse(
      await patch(editor, list, { body: [paragraph('…')], interestDeclared: true }).expect(200),
    );
    expect(l2.blockers.map((b) => b.code)).toEqual(['selection_method_required']);
    const review = await create(editor, { type: 'REVIEW', title: 'Bir kulaklığın uzun testi' });
    const r2 = parse(
      await patch(editor, review, { body: [paragraph('…')], interestDeclared: true }).expect(200),
    );
    expect(r2.blockers.map((b) => b.code)).toEqual(['experience_required']);
  });

  it('[REQ-ICR-005] sponsorlu içerik onayı yönetici ticari açıklama kontrolü ister', async () => {
    let s = await create(editor, { type: 'SPONSORED', title: 'Marka iş birliğiyle yaz rotası' });
    expect(s.commercialRelation).toBe('SPONSORED');
    s = parse(
      await patch(editor, s, { body: [paragraph('…')], interestDeclared: true }).expect(200),
    );
    s = parse(await move(editor, s, 'IN_REVIEW').expect(200));
    await move(editor, s, 'APPROVED').expect(403);
    s = parse(await move(admin, s, 'APPROVED').expect(200));
    expect(s.status).toBe('APPROVED');
    await http()
      .post('/v1/admin/articles')
      .set(as(author))
      .send({ type: 'SPONSORED', title: 'Yazar sponsorlu yazamaz' })
      .expect(403);
  });

  it('[REQ-ICR-005] zamanlanmış yayın: geçmiş zaman reddedilir; zamanı gelince worker yayımlar', async () => {
    let n = await create(editor, { type: 'NEWS', title: 'Yeni vapur seferleri başladı' });
    n = parse(
      await patch(editor, n, { body: [paragraph('…')], interestDeclared: true }).expect(200),
    );
    n = parse(await move(editor, n, 'IN_REVIEW').expect(200));
    n = parse(await move(editor, n, 'APPROVED').expect(200));
    expect(
      codes(
        (
          await move(editor, n, 'SCHEDULED', { scheduledAt: '2020-01-01T00:00:00.000Z' }).expect(
            422,
          )
        ).body,
      ),
    ).toEqual(['schedule_in_future']);
    const at = new Date(Date.now() + 60 * 60 * 1000);
    n = parse(await move(editor, n, 'SCHEDULED', { scheduledAt: at.toISOString() }).expect(200));
    expect(n.status).toBe('SCHEDULED');
    const svc = t.app.get(AdminArticlesService);
    expect(await svc.publishDue(new Date())).toBe(0);
    expect(await svc.publishDue(new Date(at.getTime() + 1000))).toBe(1);
    const after = await t.prisma.article.findUniqueOrThrow({ where: { id: n.id } });
    expect(after.status).toBe('PUBLISHED');
  });

  it('[REQ-ICR-005] imzalı önizleme bağlantısı; yazar yalnız kendi içeriklerini listeler', async () => {
    const link = PreviewLink.parse(
      (await http().post(`/v1/admin/articles/${guide.id}/preview`).set(as(editor)).expect(200))
        .body,
    );
    const token = new URL(link.url).searchParams.get('belirtec')!;
    expect(verifyToken(token, t.env.CURSOR_SECRET, PREVIEW_PURPOSE)).toMatchObject({
      articleId: guide.id,
    });
    const mine = AdminArticleList.parse(
      (await http().get('/v1/admin/articles').set(as(author)).expect(200)).body,
    );
    expect(mine.data.every((a) => a.authorName === mine.data[0]!.authorName)).toBe(true);
    const all = AdminArticleList.parse(
      (await http().get('/v1/admin/articles').set(as(editor)).expect(200)).body,
    );
    expect(all.data.length).toBeGreaterThan(mine.data.length);
    const clash = await http()
      .post('/v1/admin/articles')
      .set(as(editor))
      .send({ type: 'GUIDE', title: 'Kadıköy gezi rehberi' })
      .expect(409);
    expect(codes(clash.body)).toEqual(['slug_taken']);
  });
});

describe('herkese açık içerik (REQ-ICR-003, REQ-SEO-001)', () => {
  it('[REQ-ICR-003] yayındaki içerik canlı listeleme kartıyla döner; taslak 404; önizleme belirteçle her durumda', async () => {
    const cat = await t.prisma.category.create({
      data: {
        slug: 'test-restoran',
        name: 'Test restoran',
        allowedKinds: ['PLACE'],
        status: 'PUBLISHED',
        firstPublishedAt: new Date(),
      },
    });
    const closed = await t.prisma.listing.create({
      data: {
        kind: 'PLACE',
        slug: 'kapanan-yer',
        name: 'Kapanan Yer',
        primaryCategoryId: cat.id,
        status: 'CLOSED_PERMANENTLY',
        publishedAt: new Date(),
        dataOrigin: 'EDITORIAL',
        source: 'Editör',
      },
    });
    let a = await create(editor, { type: 'GUIDE', title: 'Moda sahili rehberi' });
    a = parse(
      await patch(editor, a, {
        body: [paragraph('Sahil boyunca yürüyüş.'), { type: 'listingCard', listingId: closed.id }],
        interestDeclared: true,
        commercialRelation: 'GIFTED',
      }).expect(200),
    );
    await http().get(`/v1/articles/${a.slug}`).expect(404);
    const link = PreviewLink.parse(
      (await http().post(`/v1/admin/articles/${a.id}/preview`).set(as(editor)).expect(200)).body,
    );
    const token = new URL(link.url).searchParams.get('belirtec')!;
    const preview = await http()
      .get(`/v1/preview/article?token=${encodeURIComponent(token)}`)
      .expect(200);
    expect(preview.headers['x-robots-tag']).toBe('noindex');
    expect(preview.body.status).toBe('DRAFT');
    await http().get('/v1/preview/article?token=gecersiz-belirtec-xyz').expect(404);

    a = parse(await move(editor, a, 'IN_REVIEW').expect(200));
    a = parse(await move(editor, a, 'APPROVED').expect(200));
    a = parse(await move(editor, a, 'PUBLISHED').expect(200));
    const pub = (await http().get(`/v1/articles/${a.slug}`).expect(200)).body as {
      commercialRelation: string;
      listings: Record<string, { status: string; visible: boolean; name: string }>;
    };
    expect(pub.commercialRelation).toBe('GIFTED');
    expect(pub.listings[closed.id]).toMatchObject({
      status: 'CLOSED_PERMANENTLY',
      visible: true,
      name: 'Kapanan Yer',
    });

    const sitemap = (await http().get('/v1/sitemap/articles').expect(200)).body as {
      data: Array<{ slug: string }>;
    };
    expect(sitemap.data.map((d) => d.slug)).toEqual(
      expect.arrayContaining([a.slug, 'kadikoy-gezi-rehberi']),
    );
    expect(sitemap.data.map((d) => d.slug)).not.toContain('marka-is-birligiyle-yaz-rotasi');
  });
});

describe('yazar profili (REQ-ICR-011)', () => {
  const body = {
    slug: 'icerik-yazar',
    title: 'Gezi yazarı',
    bio: 'İstanbul semtleri üzerine yazar.',
    expertise: ['İstanbul', 'Sokak lezzetleri'],
    ethics: 'Ücretsiz davet kabul etmez.',
    links: [{ label: 'Kişisel site', url: 'https://ornek.example' }],
  };

  it('[REQ-ICR-011] personel kendi profilini oluşturur; sürüm denetimi ve adres çakışması', async () => {
    const empty = AuthorProfile.parse(
      (await http().get('/v1/admin/author-profile').set(as(author)).expect(200)).body,
    );
    expect(empty.profile).toBeNull();
    const created = AuthorProfile.parse(
      (await http().put('/v1/admin/author-profile').set(as(author)).send(body).expect(200)).body,
    );
    expect(created.profile).toMatchObject({ slug: 'icerik-yazar', version: 1 });
    // Sürümsüz ikinci yazım (eski form) reddedilir.
    await http().put('/v1/admin/author-profile').set(as(author)).send(body).expect(412);
    const updated = AuthorProfile.parse(
      (
        await http()
          .put('/v1/admin/author-profile')
          .set(as(author))
          .send({ ...body, title: 'Kıdemli gezi yazarı', version: 1 })
          .expect(200)
      ).body,
    );
    expect(updated.profile).toMatchObject({ title: 'Kıdemli gezi yazarı', version: 2 });
    const clash = await http()
      .put('/v1/admin/author-profile')
      .set(as(editor))
      .send({ ...body, slug: 'icerik-yazar' })
      .expect(409);
    expect(codes(clash.body)).toEqual(['slug_taken']);
    // Yalnızca https bağlantı.
    await http()
      .put('/v1/admin/author-profile')
      .set(as(editor))
      .send({ ...body, slug: 'icerik-editor', links: [{ label: 'Site', url: 'http://x.example' }] })
      .expect(422);
    const log = await t.prisma.auditLog.findMany({
      where: { action: { startsWith: 'editorial.author_profile.' } },
    });
    expect(log.map((l) => l.action).sort()).toEqual([
      'editorial.author_profile.created',
      'editorial.author_profile.updated',
    ]);
  });

  it('[REQ-ICR-011] yazar sayfası yalnızca yayındaki içerikleri listeler; makale künyesi yazar sayfasına bağlanır', async () => {
    const page = PublicAuthor.parse(
      (await http().get('/v1/authors/icerik-yazar').expect(200)).body,
    );
    expect(page).toMatchObject({ title: 'Kıdemli gezi yazarı', expertise: body.expertise });
    expect(page.articles.length).toBeGreaterThan(0);
    const drafts = await t.prisma.article.findMany({
      where: { author: { email: 'icerik-yazar@example.com' }, status: { not: 'PUBLISHED' } },
      select: { slug: true },
    });
    for (const d of drafts) expect(page.articles.map((a) => a.slug)).not.toContain(d.slug);
    const first = page.articles[0]!;
    const article = await http().get(`/v1/articles/${first.slug}`).expect(200);
    expect(article.body.author).toEqual({ displayName: page.displayName, slug: 'icerik-yazar' });
    await http().get('/v1/authors/olmayan-yazar').expect(404);
  });
});
