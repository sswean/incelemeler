import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ImportBatch, Problem } from '@incelemeler/contracts';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { staffToken } from './staff.js';

let t: TestContext;
let editor: string;
let author: string;
let restoranlar: string;
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}` });

const CSV = [
  'Ad;İl;İlçe;Enlem;Boylam;Telefon;Web;Fiyat seviyesi;Notlar',
  'Yeni Lokanta;İstanbul;Kadıköy;40,9800;29,0300;+90 216 111 11 11;ornek.example;₺₺;not',
  'Deneme Balıkçısı;İstanbul;Kadıköy;40,99005;29,03005;;;;',
  'YENİ LOKANTA;34;Kadıköy;40,98005;29,03;;;;',
  ';İstanbul;;;;;;;',
  'Uzak Kafe;İstanbul;Olmayanilçe;;;;;5;',
  'Koordinatsız Mekan;İzmir;Konak;;;+90 232 000 00 00;;;',
].join('\n');

function preview(csv = CSV, token = editor, extra: Record<string, unknown> = {}) {
  return http()
    .post('/v1/admin/imports')
    .set(as(token))
    .send({
      kind: 'PLACE',
      primaryCategoryId: restoranlar,
      source: 'Belediye açık veri kümesi (lisans: test)',
      fileName: 'mekanlar.csv',
      csv,
      ...extra,
    });
}

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  editor = await staffToken(t, 'aktarim-editor@example.com', ['EDITOR']);
  author = await staffToken(t, 'aktarim-yazar@example.com', ['AUTHOR']);
  restoranlar = (await t.prisma.category.findUniqueOrThrow({ where: { slug: 'restoranlar' } })).id;
  const istanbul = await t.prisma.adminArea.findFirstOrThrow({ where: { code: '34' } });
  // Var olan listeleme: yinelenen tespiti için (kurgusal ad).
  await t.prisma.listing.create({
    data: {
      kind: 'PLACE',
      slug: 'deneme-balikcisi',
      name: 'Deneme Balıkçısı',
      primaryCategoryId: restoranlar,
      dataOrigin: 'EDITORIAL',
      source: 'Editör girişi',
      location: { create: { provinceId: istanbul.id, latitude: 40.99, longitude: 29.03 } },
    },
  });
});

afterAll(async () => {
  await t?.close();
});

describe('toplu içe aktarma (REQ-LST-007)', () => {
  let batch: ImportBatch;

  it('[REQ-LST-007] önizleme: alan eşleme, doğrulama raporu ve yinelenen tespiti; kayıt oluşturmaz', async () => {
    const res = await preview().expect(201);
    batch = ImportBatch.parse(res.body);
    expect(batch.status).toBe('PREVIEW');
    expect(batch.unmappedHeaders).toEqual(['Notlar']);
    expect(batch.rows.map((r) => [r.row, r.status])).toEqual([
      [2, 'VALID'],
      [3, 'DUPLICATE'],
      [4, 'DUPLICATE'],
      [5, 'INVALID'],
      [6, 'INVALID'],
      [7, 'VALID'],
    ]);
    expect(batch.rows[1]!.duplicateOf).toMatchObject({ reason: 'name_proximity', row: null });
    expect(batch.rows[2]!.duplicateOf).toMatchObject({ reason: 'name_proximity', row: 2 });
    expect(batch.rows[3]!.errors).toEqual([{ field: 'name', code: 'name_required' }]);
    expect(batch.rows[4]!.errors.map((e) => e.code)).toEqual([
      'district_not_found',
      'price_level_invalid',
    ]);
    expect(batch.validCount).toBe(2);
    expect(await t.prisma.listing.count({ where: { dataOrigin: 'IMPORT' } })).toBe(0);
  });

  it('[REQ-LST-007] onay: geçerli satırlar TASLAK ve dataOrigin=IMPORT olarak oluşur; ikinci onay 409', async () => {
    const res = await http()
      .post(`/v1/admin/imports/${batch.id}/commit`)
      .set(as(editor))
      .expect(200);
    const done = ImportBatch.parse(res.body);
    expect(done).toMatchObject({ status: 'COMMITTED', createdCount: 2 });
    expect(done.rows.filter((r) => r.status === 'CREATED')).toHaveLength(2);
    const created = await t.prisma.listing.findMany({
      where: { importBatchId: batch.id },
      include: { location: true },
      orderBy: { name: 'asc' },
    });
    expect(created.map((l) => [l.name, l.status, l.dataOrigin])).toEqual([
      ['Koordinatsız Mekan', 'DRAFT', 'IMPORT'],
      ['Yeni Lokanta', 'DRAFT', 'IMPORT'],
    ]);
    const yeni = created.find((l) => l.name === 'Yeni Lokanta')!;
    expect(yeni.source).toBe('Belediye açık veri kümesi (lisans: test)');
    expect(yeni.priceLevel).toBe(2);
    expect(yeni.contacts).toMatchObject({ website: 'https://ornek.example' });
    expect(Number(yeni.location?.latitude)).toBe(40.98);
    await http().post(`/v1/admin/imports/${batch.id}/commit`).set(as(editor)).expect(409);
  });

  it('[REQ-LST-007] geri alma: işlem kimliğiyle oluşan listelemeler kaldırılır', async () => {
    const res = await http()
      .post(`/v1/admin/imports/${batch.id}/rollback`)
      .set(as(editor))
      .expect(200);
    expect(ImportBatch.parse(res.body).status).toBe('ROLLED_BACK');
    expect(
      await t.prisma.listing.count({ where: { importBatchId: batch.id, deletedAt: null } }),
    ).toBe(0);
  });

  it('[REQ-LST-007] işlemden sonra düzenlenen listeleme varsa geri alma reddedilir', async () => {
    const second = ImportBatch.parse((await preview().expect(201)).body);
    await http().post(`/v1/admin/imports/${second.id}/commit`).set(as(editor)).expect(200);
    const one = await t.prisma.listing.findFirstOrThrow({ where: { importBatchId: second.id } });
    await http()
      .patch(`/v1/admin/listings/${one.id}`)
      .set(as(editor))
      .send({ version: one.version, shortDescription: 'Editör düzenledi' })
      .expect(200);
    const res = await http()
      .post(`/v1/admin/imports/${second.id}/rollback`)
      .set(as(editor))
      .expect(409);
    expect(Problem.parse(res.body).errors?.[0]?.code).toBe('batch_modified');
  });

  it('[REQ-LST-007] kaynak zorunlu; ad sütunu zorunlu; yazar içe aktaramaz', async () => {
    await preview(CSV, editor, { source: '' }).expect(422);
    const noName = await preview('İl;İlçe\nİstanbul;Kadıköy').expect(422);
    expect(Problem.parse(noName.body).errors?.[0]?.code).toBe('name_column_required');
    await preview(CSV, author).expect(403);
  });
});
