import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AdminArticle, AdminArticleList, PreviewLink, Problem } from '@incelemeler/contracts';
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
    const token = link.url.split('/onizleme/')[1]!;
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
