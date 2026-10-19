import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AdminCategory, AdminCategoryList, CategoryList, Problem } from '@incelemeler/contracts';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { staffToken } from './staff.js';

let t: TestContext;
let admin: string;
let editor: string;
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}` });

function create(body: Record<string, unknown>, token = admin) {
  return http().post('/v1/admin/categories').set(as(token)).send(body);
}
async function bySlug(slug: string) {
  return t.prisma.category.findUniqueOrThrow({ where: { slug } });
}

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  admin = await staffToken(t, 'yonetici@example.com', ['ADMIN']);
  editor = await staffToken(t, 'editor@example.com', ['EDITOR']);
});

afterAll(async () => {
  await t?.close();
});

describe('kategori yönetimi', () => {
  it('[REQ-KAT-001] yönetici alt kategori oluşturur; TASLAK başlar, denetim kaydı ve outbox olayı aynı işlemde yazılır', async () => {
    const parent = await bySlug('konaklama');
    const res = await create({
      name: 'Glamping alanları',
      parentId: parent.id,
      allowedKinds: ['LODGING'],
    }).expect(201);
    const c = AdminCategory.parse(res.body);
    expect(c).toMatchObject({ slug: 'glamping-alanlari', status: 'DRAFT', depth: 2, version: 1 });
    // Konaklama lisanslı kategori: bayraklar üstten devralınır, sponsorluk kapalı (REQ-KAT-004).
    expect(c.requiresLicense).toBe(true);
    expect(c.sponsorshipAllowed).toBe(false);
    const audit = await t.prisma.auditLog.findFirst({
      where: { action: 'taxonomy.category.create', targetId: c.id },
    });
    expect(audit?.actorId).toBeTruthy();
    const events = await t.prisma.outboxEvent.findMany({ where: { aggregateId: c.id } });
    expect(events.map((e) => e.type)).toEqual(['taxonomy.category.created']);
  });

  it('[REQ-KAT-001] kurallar: 3 seviye sınırı, üst kategorinin türleri, benzersiz slug', async () => {
    const parent = await bySlug('glamping-alanlari');
    const level3 = AdminCategory.parse(
      (await create({ name: 'Orman glamping', parentId: parent.id, allowedKinds: ['LODGING'] }))
        .body,
    );
    expect(level3.depth).toBe(3);
    const tooDeep = await create({
      name: 'Dördüncü seviye',
      parentId: level3.id,
      allowedKinds: ['LODGING'],
    }).expect(422);
    expect(Problem.parse(tooDeep.body).errors?.[0]?.code).toBe('depth_exceeded');

    const wrongKind = await create({
      name: 'Yanlış tür',
      parentId: parent.id,
      allowedKinds: ['PRODUCT'],
    }).expect(422);
    expect(Problem.parse(wrongKind.body).errors?.[0]?.code).toBe('kinds_not_in_parent');

    const dup = await create({ name: 'Glamping alanları', allowedKinds: ['LODGING'] }).expect(409);
    expect(Problem.parse(dup.body).errors?.[0]?.code).toBe('slug_taken');
  });

  it('[REQ-KAT-004] YMYL kategoride sponsorluk açılamaz ve uzman incelemesi zorunludur', async () => {
    const res = await create({
      name: 'Sağlık hizmetleri',
      allowedKinds: ['SERVICE_PROVIDER'],
      ymyl: true,
      sponsorshipAllowed: true,
    }).expect(422);
    expect(Problem.parse(res.body).errors?.map((e) => e.code)).toEqual(['sponsorship_restricted']);
    const ok = AdminCategory.parse(
      (await create({ name: 'Sağlık hizmetleri', allowedKinds: ['SERVICE_PROVIDER'], ymyl: true }))
        .body,
    );
    expect(ok).toMatchObject({ ymyl: true, requiresExpertReview: true, sponsorshipAllowed: false });
    const off = await http()
      .patch(`/v1/admin/categories/${ok.id}`)
      .set(as(admin))
      .send({ version: ok.version, requiresExpertReview: false })
      .expect(422);
    expect(Problem.parse(off.body).errors?.[0]?.code).toBe('ymyl_requires_expert_review');
  });

  it('[REQ-KAT-003] TASLAK → GİZLİ → YAYINDA; üst kategori yayında değilken alt kategori yayımlanamaz', async () => {
    const parent = AdminCategory.parse(
      (await create({ name: 'Su sporları', allowedKinds: ['EXPERIENCE'] })).body,
    );
    const child = AdminCategory.parse(
      (await create({ name: 'Yelken', parentId: parent.id, allowedKinds: ['EXPERIENCE'] })).body,
    );
    const blocked = await http()
      .patch(`/v1/admin/categories/${child.id}`)
      .set(as(admin))
      .send({ version: child.version, status: 'PUBLISHED' })
      .expect(422);
    expect(Problem.parse(blocked.body).errors?.[0]?.code).toBe('parent_not_published');

    const hidden = AdminCategory.parse(
      (
        await http()
          .patch(`/v1/admin/categories/${parent.id}`)
          .set(as(admin))
          .send({ version: parent.version, status: 'HIDDEN' })
          .expect(200)
      ).body,
    );
    expect(hidden).toMatchObject({ status: 'HIDDEN', version: 2, firstPublishedAt: null });
    const published = AdminCategory.parse(
      (
        await http()
          .patch(`/v1/admin/categories/${parent.id}`)
          .set(as(admin))
          .send({ version: hidden.version, status: 'PUBLISHED' })
          .expect(200)
      ).body,
    );
    expect(published.firstPublishedAt).not.toBeNull();
    await http()
      .patch(`/v1/admin/categories/${child.id}`)
      .set(as(admin))
      .send({ version: child.version, status: 'PUBLISHED' })
      .expect(200);

    const publicList = async () =>
      CategoryList.parse((await http().get('/v1/categories?limit=100').expect(200)).body).data.map(
        (c) => c.slug,
      );
    expect(await publicList()).toEqual(expect.arrayContaining(['su-sporlari', 'yelken']));

    // Üst kategori gizlenince yayındaki alt kategori de herkese açık listeden çıkar.
    await http()
      .patch(`/v1/admin/categories/${parent.id}`)
      .set(as(admin))
      .send({ version: published.version, status: 'HIDDEN' })
      .expect(200);
    const after = await publicList();
    expect(after).not.toContain('su-sporlari');
    expect(after).not.toContain('yelken');
  });

  it("[REQ-KAT-003] yayımlanmış kategorinin slug'ı değişmez", async () => {
    const c = await bySlug('yelken');
    const res = await http()
      .patch(`/v1/admin/categories/${c.id}`)
      .set(as(admin))
      .send({ version: c.version, slug: 'yelkencilik' })
      .expect(422);
    expect(Problem.parse(res.body).errors?.[0]?.code).toBe('slug_locked');
  });

  it('[REQ-MIM-011] eski sürümle güncelleme 412 döner, değişiklik uygulanmaz', async () => {
    const c = await bySlug('orman-glamping');
    await http()
      .patch(`/v1/admin/categories/${c.id}`)
      .set(as(admin))
      .send({ version: c.version, name: 'Orman glamping alanları' })
      .expect(200);
    const stale = await http()
      .patch(`/v1/admin/categories/${c.id}`)
      .set(as(admin))
      .send({ version: c.version, name: 'Çakışan ad' })
      .expect(412);
    expect(Problem.parse(stale.body).code).toBe('PRECONDITION_FAILED');
    expect((await bySlug('orman-glamping')).name).toBe('Orman glamping alanları');
  });

  it('[REQ-HSP-009] editör kategorileri görür ama değiştiremez; üye panel listesine erişemez', async () => {
    const list = AdminCategoryList.parse(
      (await http().get('/v1/admin/categories').set(as(editor)).expect(200)).body,
    );
    expect(list.data.length).toBeGreaterThan(70);
    // Ağaç sırası: her alt kategori üst kategorisinden sonra gelir.
    const seen = new Set<string>();
    for (const c of list.data) {
      if (c.parentId) expect(seen.has(c.parentId)).toBe(true);
      seen.add(c.id);
    }
    const denied = await create({ name: 'Editör kategorisi', allowedKinds: ['PLACE'] }, editor);
    expect(denied.status).toBe(403);
    await http().get('/v1/admin/categories').expect(401);
  });

  it('[REQ-GUV-001] olmayan ya da biçimsiz kimlik 404', async () => {
    await http()
      .get('/v1/admin/categories/00000000-0000-7000-8000-000000000000')
      .set(as(admin))
      .expect(404);
    await http().get('/v1/admin/categories/abc').set(as(admin)).expect(404);
  });
});
