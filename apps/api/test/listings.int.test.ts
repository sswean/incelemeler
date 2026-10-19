import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AdminAreaList, AdminListing, AdminListingList, Problem } from '@incelemeler/contracts';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { staffToken } from './staff.js';

let t: TestContext;
let admin: string;
let editor: string;
let author: string;
let moderator: string;
const ids: Record<string, string> = {};
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}` });
const codes = (body: unknown) => Problem.parse(body).errors?.map((e) => e.code);

function create(body: Record<string, unknown>, token = editor) {
  return http().post('/v1/admin/listings').set(as(token)).send(body);
}
function patch(id: string, body: Record<string, unknown>, token = editor) {
  return http().patch(`/v1/admin/listings/${id}`).set(as(token)).send(body);
}
function status(id: string, version: number, to: string, token = editor) {
  return http()
    .post(`/v1/admin/listings/${id}/status`)
    .set(as(token))
    .send({ version, status: to });
}
const kadikoy = () => ({
  provinceId: ids.istanbul,
  districtId: ids.kadikoy,
  addressLine: 'Örnek Sokak No: 1',
  latitude: 40.990123456,
  longitude: 29.0289,
});

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  admin = await staffToken(t, 'liste-yonetici@example.com', ['ADMIN']);
  editor = await staffToken(t, 'liste-editor@example.com', ['EDITOR']);
  author = await staffToken(t, 'liste-yazar@example.com', ['AUTHOR']);
  moderator = await staffToken(t, 'liste-moderator@example.com', ['MODERATOR']);
  for (const slug of ['restoranlar', 'oteller', 'kafeler', 'telefonlar']) {
    ids[slug] = (await t.prisma.category.findUniqueOrThrow({ where: { slug } })).id;
  }
  const istanbul = await t.prisma.adminArea.findFirstOrThrow({
    where: { level: 'PROVINCE', code: '34' },
  });
  ids.istanbul = istanbul.id;
  ids.kadikoy = (
    await t.prisma.adminArea.findFirstOrThrow({ where: { parentId: istanbul.id, slug: 'kadikoy' } })
  ).id;
  ids.cankaya = (
    await t.prisma.adminArea.findFirstOrThrow({ where: { level: 'PROVINCE', code: '06' } })
  ).id;
});

afterAll(async () => {
  await t?.close();
});

describe('idari bölgeler (REQ-VER-009)', () => {
  it('[REQ-VER-009] 81 il plaka koduyla; lansman illerinin ilçeleri', async () => {
    const provinces = AdminAreaList.parse(
      (await http().get('/v1/admin-areas?level=PROVINCE').expect(200)).body,
    ).data;
    expect(provinces).toHaveLength(81);
    expect(provinces[0]).toMatchObject({ code: '01', name: 'Adana' });
    expect(provinces.find((p) => p.code === '34')?.name).toBe('İstanbul');
    const districts = AdminAreaList.parse(
      (await http().get(`/v1/admin-areas?parentId=${ids.istanbul}`).expect(200)).body,
    ).data;
    expect(districts).toHaveLength(39);
  });
});

describe('listeleme yönetimi', () => {
  it('[REQ-LST-001] [REQ-VER-009] editör mekan oluşturur; eksiksizse yayımlar; konum PostGIS noktasına dönüşür', async () => {
    const res = await create({
      kind: 'PLACE',
      name: 'Deneme Lokantası',
      primaryCategoryId: ids.restoranlar,
      secondaryCategoryIds: [ids.kafeler],
      source: 'Editör ziyareti',
      contacts: { phone: '+90 216 000 00 00', website: 'https://ornek.example' },
      location: kadikoy(),
      priceLevel: 2,
    }).expect(201);
    const l = AdminListing.parse(res.body);
    expect(l).toMatchObject({
      slug: 'deneme-lokantasi',
      status: 'DRAFT',
      publishBlockers: [],
      secondaryCategoryIds: [ids.kafeler],
    });
    expect(l.location).toMatchObject({ districtName: 'Kadıköy', latitude: 40.990123 });
    const published = AdminListing.parse(
      (await status(l.id, l.version, 'PUBLISHED').expect(200)).body,
    );
    expect(published.status).toBe('PUBLISHED');
    expect(published.publishedAt).not.toBeNull();
    const near = await t.prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT count(*) AS n FROM listing_locations
       WHERE ST_DWithin(geo, ST_SetSRID(ST_MakePoint(29.0289, 40.9901), 4326)::geography, 50)`;
    expect(Number(near[0]?.n)).toBe(1);
    expect(
      await t.prisma.outboxEvent.count({ where: { aggregateId: l.id } }),
    ).toBeGreaterThanOrEqual(2);
  });

  it('[REQ-LST-001] eksik zorunlu alanla yayın 422; eksikler listede', async () => {
    const l = AdminListing.parse(
      (
        await create({
          kind: 'PLACE',
          name: 'Eksik Mekan',
          primaryCategoryId: ids.restoranlar,
          source: 'Editör girişi',
        }).expect(201)
      ).body,
    );
    expect(l.publishBlockers.map((b) => b.code)).toEqual(['location_required', 'contact_required']);
    const res = await status(l.id, l.version, 'PUBLISHED').expect(422);
    expect(codes(res.body)).toEqual(['location_required', 'contact_required']);
  });

  it('[REQ-VER-003] özellikler kategori şemasına karşı doğrulanır; zorunlu özellik yayını engeller', async () => {
    await http()
      .post(`/v1/admin/categories/${ids.restoranlar}/attributes`)
      .set(as(admin))
      .send({
        key: 'cuisine',
        label: 'Mutfak',
        type: 'ENUM',
        options: [
          { value: 'turk', label: 'Türk mutfağı' },
          { value: 'deniz', label: 'Deniz ürünleri' },
        ],
      })
      .expect(201);
    const base = {
      kind: 'PLACE',
      primaryCategoryId: ids.restoranlar,
      source: 'Editör girişi',
    };
    expect(
      codes(
        (await create({ ...base, name: 'A1', attributes: { unknownKey: true } }).expect(422)).body,
      ),
    ).toEqual(['attribute_unknown']);
    expect(
      codes(
        (await create({ ...base, name: 'A2', attributes: { cuisine: 'pizza' } }).expect(422)).body,
      ),
    ).toEqual(['attribute_invalid']);
    const ok = AdminListing.parse(
      (await create({ ...base, name: 'A3', attributes: { cuisine: 'deniz' } }).expect(201)).body,
    );
    expect(ok.attributes).toEqual({ cuisine: 'deniz' });
    expect(ok.attributeSchemaVersion).toBeGreaterThan(0);
  });

  it('[REQ-KAT-004] lisanslı kategoride hukuki kapı: gerçek listeleme onaysız yayımlanamaz; TEST-FIXTURE yalnız DEMO için', async () => {
    const lodging = {
      kind: 'LODGING',
      primaryCategoryId: ids.oteller,
      source: 'Editör girişi',
      contacts: { phone: '+90 212 000 00 00' },
      location: kadikoy(),
      details: { lodging: { tourismLicenseNo: 'BELGE-123' } },
    };
    const real = AdminListing.parse(
      (await create({ ...lodging, name: 'Gerçek Otel' }).expect(201)).body,
    );
    expect(real.publishBlockers.map((b) => b.code)).toEqual(['legal_gate_closed']);
    await t.prisma.legalApproval.create({
      data: { categoryId: real.primaryCategory.id, approvedBy: 'TEST-FIXTURE' },
    });
    expect(codes((await status(real.id, real.version, 'PUBLISHED').expect(422)).body)).toEqual([
      'legal_gate_closed',
    ]);

    expect(
      codes(
        (await create({ ...lodging, name: 'Etiketsiz Demo Otel', dataOrigin: 'DEMO' }).expect(422))
          .body,
      ),
    ).toEqual(['demo_label_required']);
    const demo = AdminListing.parse(
      (await create({ ...lodging, name: 'Örnek Otel (Demo)', dataOrigin: 'DEMO' }).expect(201))
        .body,
    );
    expect(demo.publishBlockers).toEqual([]);
    await status(demo.id, demo.version, 'PUBLISHED').expect(200);
  });

  it("[REQ-VER-013] yayımlanmış listelemenin eski slug'ı saklanır ve başka listelemeye verilmez", async () => {
    const row = await t.prisma.listing.findUniqueOrThrow({ where: { slug: 'deneme-lokantasi' } });
    const l = AdminListing.parse(
      (await http().get(`/v1/admin/listings/${row.id}`).set(as(editor)).expect(200)).body,
    );
    const renamed = AdminListing.parse(
      (await patch(l.id, { version: l.version, slug: 'deneme-lokantasi-kadikoy' }).expect(200))
        .body,
    );
    expect(renamed.slug).toBe('deneme-lokantasi-kadikoy');
    const history = await t.prisma.slugHistory.findMany({ where: { entityId: l.id } });
    expect(history.map((h) => h.slug)).toEqual(['deneme-lokantasi']);
    const clash = await create({
      kind: 'PLACE',
      name: 'Deneme Lokantası',
      primaryCategoryId: ids.restoranlar,
      source: 'Editör girişi',
    }).expect(409);
    expect(codes(clash.body)).toEqual(['slug_taken']);
    // Eski slug'a geri dönülünce geçmiş kaydı kalkar.
    await patch(l.id, { version: renamed.version, slug: 'deneme-lokantasi' }).expect(200);
    expect(
      (await t.prisma.slugHistory.findMany({ where: { entityId: l.id } })).map((h) => h.slug),
    ).toEqual(['deneme-lokantasi-kadikoy']);
  });

  it('[REQ-HSP-009] yazar taslak oluşturur ama yayımlayamaz ve yayındakini düzenleyemez; moderatör erişemez', async () => {
    const draft = AdminListing.parse(
      (
        await create(
          {
            kind: 'PLACE',
            name: 'Yazar Taslağı',
            primaryCategoryId: ids.restoranlar,
            source: 'Yazar girişi',
            contacts: { phone: '+90 216 111 11 11' },
            location: kadikoy(),
          },
          author,
        ).expect(201)
      ).body,
    );
    await status(draft.id, draft.version, 'PUBLISHED', author).expect(403);
    const review = AdminListing.parse(
      (await status(draft.id, draft.version, 'IN_REVIEW', author).expect(200)).body,
    );
    const published = AdminListing.parse(
      (await status(draft.id, review.version, 'PUBLISHED', editor).expect(200)).body,
    );
    await patch(draft.id, { version: published.version, name: 'Yazar değiştirdi' }, author).expect(
      403,
    );
    await http().get('/v1/admin/listings').set(as(moderator)).expect(403);
  });

  it('[REQ-VER-009] ilçe başka ile aitse, tür uzantısı yanlışsa 422; eski sürüm 412', async () => {
    expect(
      codes(
        (
          await create({
            kind: 'PLACE',
            name: 'Yanlış İlçe',
            primaryCategoryId: ids.restoranlar,
            source: 'Editör girişi',
            location: { ...kadikoy(), provinceId: ids.cankaya },
            details: { lodging: { tourismLicenseNo: 'X' } },
          }).expect(422)
        ).body,
      ),
    ).toEqual(['district_mismatch', 'details_kind_mismatch']);
    const l = AdminListing.parse(
      (
        await create({
          kind: 'PRODUCT',
          name: 'Örnek Telefon',
          primaryCategoryId: ids.telefonlar,
          source: 'Üretici teknik belgesi',
          details: { product: { brand: 'Marka', model: 'Model X' } },
        }).expect(201)
      ).body,
    );
    expect(l.publishBlockers.map((b) => b.code)).toEqual(['specs_min_5']);
    await patch(l.id, { version: l.version, name: 'Örnek Telefon 2' }).expect(200);
    expect(
      Problem.parse((await patch(l.id, { version: l.version, name: 'Eski' }).expect(412)).body)
        .code,
    ).toBe('PRECONDITION_FAILED');
  });

  it('[REQ-MIM-008] liste filtreleri ve cursor sayfalama', async () => {
    const first = AdminListingList.parse(
      (await http().get('/v1/admin/listings?kind=PLACE&limit=2').set(as(editor)).expect(200)).body,
    );
    expect(first.data).toHaveLength(2);
    expect(first.page.hasMore).toBe(true);
    const second = AdminListingList.parse(
      (
        await http()
          .get(`/v1/admin/listings?kind=PLACE&limit=2&cursor=${first.page.nextCursor}`)
          .set(as(editor))
          .expect(200)
      ).body,
    );
    const seen = new Set(first.data.map((l) => l.id));
    expect(second.data.every((l) => !seen.has(l.id) && l.kind === 'PLACE')).toBe(true);
    await http().get('/v1/admin/listings?sort=sponsored').set(as(editor)).expect(400);
  });
});
