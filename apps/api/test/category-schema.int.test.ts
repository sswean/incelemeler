import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  AttributeDefinition,
  CategorySchema,
  Problem,
  ReviewCriterion,
} from '@incelemeler/contracts';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { staffToken } from './staff.js';

let t: TestContext;
let admin: string;
let editor: string;
let glampingId: string;
let konaklamaId: string;
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}` });
const schemaOf = async (id: string) =>
  CategorySchema.parse(
    (await http().get(`/v1/admin/categories/${id}/schema`).set(as(admin)).expect(200)).body,
  );
const addAttr = (id: string, body: Record<string, unknown>, token = admin) =>
  http().post(`/v1/admin/categories/${id}/attributes`).set(as(token)).send(body);
const codes = (body: unknown) => Problem.parse(body).errors?.map((e) => e.code);

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  admin = await staffToken(t, 'sema-yonetici@example.com', ['ADMIN']);
  editor = await staffToken(t, 'sema-editor@example.com', ['EDITOR']);
  konaklamaId = (await t.prisma.category.findUniqueOrThrow({ where: { slug: 'konaklama' } })).id;
  const res = await http()
    .post('/v1/admin/categories')
    .set(as(admin))
    .send({ name: 'Glamping alanları', parentId: konaklamaId, allowedKinds: ['LODGING'] })
    .expect(201);
  glampingId = res.body.id as string;
});

afterAll(async () => {
  await t?.close();
});

describe('özellik şeması (REQ-VER-003)', () => {
  it('[REQ-KAT-001] [REQ-VER-003] yönetici Glamping için 3 tipli özellik tanımlar; şema sürümü artar ve anlık görüntü yazılır', async () => {
    const before = await schemaOf(glampingId);
    const bath = AttributeDefinition.parse(
      (
        await addAttr(glampingId, {
          key: 'hasPrivateBathroom',
          label: 'Özel banyo',
          type: 'BOOL',
          filterable: true,
          showOnCard: true,
        }).expect(201)
      ).body,
    );
    expect(bath).toMatchObject({ key: 'hasPrivateBathroom', filterable: true, archived: false });
    await addAttr(glampingId, {
      key: 'tentType',
      label: 'Çadır tipi',
      type: 'ENUM',
      options: [
        { value: 'safari', label: 'Safari çadırı' },
        { value: 'bubble', label: 'Balon çadır' },
      ],
      filterable: true,
    }).expect(201);
    await addAttr(glampingId, {
      key: 'maxGuests',
      label: 'En fazla kişi',
      type: 'INT',
      unit: 'kişi',
      validation: { min: 1, max: 12 },
      filterable: true,
    }).expect(201);

    const after = await schemaOf(glampingId);
    expect(after.schemaVersion).toBe(before.schemaVersion + 3);
    expect(after.attributes.map((a) => a.key)).toEqual([
      'hasPrivateBathroom',
      'tentType',
      'maxGuests',
    ]);
    const snapshot = await t.prisma.categorySchemaVersion.findUniqueOrThrow({
      where: { categoryId_version: { categoryId: glampingId, version: after.schemaVersion } },
    });
    expect((snapshot.definitions as Array<{ key: string }>).map((d) => d.key)).toHaveLength(3);
    expect(
      await t.prisma.outboxEvent.count({
        where: { type: 'taxonomy.schema.changed', aggregateId: glampingId },
      }),
    ).toBe(3);
  });

  it('[REQ-VER-003] tip kuralları: seçenek, birim, aralık, metin filtresi', async () => {
    expect(
      codes(
        (await addAttr(glampingId, { key: 'view', label: 'Manzara', type: 'ENUM', options: [] }))
          .body,
      ),
    ).toEqual(['options_required']);
    expect(
      codes(
        (
          await addAttr(glampingId, {
            key: 'notes',
            label: 'Notlar',
            type: 'TEXT',
            unit: 'm',
            filterable: true,
          })
        ).body,
      ),
    ).toEqual(['unit_not_allowed', 'text_not_filterable']);
    expect(
      codes(
        (
          await addAttr(glampingId, {
            key: 'area',
            label: 'Alan',
            type: 'DECIMAL',
            validation: { min: 10, max: 1 },
          })
        ).body,
      ),
    ).toEqual(['range_invalid']);
    // Anahtar biçimi sözleşmede doğrulanır.
    await addAttr(glampingId, { key: 'Bad-Key', label: 'X', type: 'BOOL' }).expect(422);
  });

  it('[REQ-VER-003] anahtar ağaç dalında benzersiz; üst kategorinin özelliği devralınır', async () => {
    await addAttr(konaklamaId, {
      key: 'checkInTime',
      label: 'Giriş saati',
      type: 'TEXT',
    }).expect(201);
    const dup = await addAttr(glampingId, { key: 'checkInTime', label: 'Giriş', type: 'TEXT' });
    expect(dup.status).toBe(422);
    expect(codes(dup.body)).toEqual(['key_taken']);
    const glamping = await schemaOf(glampingId);
    const inherited = glamping.attributes.find((a) => a.key === 'checkInTime');
    expect(inherited?.inheritedFrom?.name).toBe('Konaklama');
    // Üst kategorideki değişiklik alt kategoride de yeni sürüm üretir.
    expect(glamping.schemaVersion).toBe(4);
  });

  it('[REQ-VER-003] anahtar ve tip değişmez; güncelleme sürüm ister, arşiv sonrası şemadan çıkar', async () => {
    const s = await schemaOf(glampingId);
    const tent = s.attributes.find((a) => a.key === 'tentType')!;
    await http()
      .patch(`/v1/admin/categories/${glampingId}/attributes/${tent.id}`)
      .set(as(admin))
      .send({ version: tent.version, type: 'TEXT' })
      .expect(422);
    const updated = AttributeDefinition.parse(
      (
        await http()
          .patch(`/v1/admin/categories/${glampingId}/attributes/${tent.id}`)
          .set(as(admin))
          .send({
            version: tent.version,
            options: [...tent.options, { value: 'tipi', label: 'Tipi çadır' }],
          })
          .expect(200)
      ).body,
    );
    expect(updated.options.map((o) => o.value)).toEqual(['safari', 'bubble', 'tipi']);
    await http()
      .patch(`/v1/admin/categories/${glampingId}/attributes/${tent.id}`)
      .set(as(admin))
      .send({ version: tent.version, label: 'Eski sürüm' })
      .expect(412);
    await http()
      .delete(`/v1/admin/categories/${glampingId}/attributes/${tent.id}`)
      .set(as(admin))
      .expect(204);
    const after = await schemaOf(glampingId);
    expect(after.attributes.map((a) => a.key)).not.toContain('tentType');
    expect(after.archivedAttributes.map((a) => a.key)).toEqual(['tentType']);
    // Arşivlenen anahtar ayrılmış kalır (eski veriyle çakışmasın).
    await addAttr(glampingId, { key: 'tentType', label: 'Yeni', type: 'BOOL' }).expect(422);
    // Anlık görüntüler değiştirilemez.
    await expect(
      t.prisma.categorySchemaVersion.deleteMany({ where: { categoryId: glampingId } }),
    ).rejects.toThrow();
  });

  it('[REQ-HSP-009] editör şemayı görür ama değiştiremez', async () => {
    await http().get(`/v1/admin/categories/${glampingId}/schema`).set(as(editor)).expect(200);
    await addAttr(glampingId, { key: 'pool', label: 'Havuz', type: 'BOOL' }, editor).expect(403);
  });
});

describe('değerlendirme kriterleri (Ek A6.3)', () => {
  it('[REQ-KAT-001] kendi kriteri olmayan kategori en yakın üst kategorinin kriterlerini kullanır', async () => {
    const s = await schemaOf(glampingId);
    expect(s.criteriaInheritedFrom?.name).toBe('Konaklama');
    expect(s.criteria.map((c) => c.name)).toEqual([
      'Konum',
      'Temizlik',
      'Oda konforu',
      'Personel',
      'Yeme-içme',
      'Fiyat/performans',
    ]);
  });

  it('[REQ-KAT-001] kendi kriterleri tanımlanınca devralma biter; en fazla 6 kriter', async () => {
    const names = [
      'Konum',
      'Doğa ile uyum',
      'Temizlik',
      'Çadır konforu',
      'Sessizlik',
      'Fiyat/performans',
    ];
    for (const name of names) {
      ReviewCriterion.parse(
        (
          await http()
            .post(`/v1/admin/categories/${glampingId}/criteria`)
            .set(as(admin))
            .send({ name })
            .expect(201)
        ).body,
      );
    }
    const s = await schemaOf(glampingId);
    expect(s.criteriaInheritedFrom).toBeNull();
    expect(s.criteria.map((c) => c.name)).toEqual(names);
    const seventh = await http()
      .post(`/v1/admin/categories/${glampingId}/criteria`)
      .set(as(admin))
      .send({ name: 'Manzara' })
      .expect(422);
    expect(codes(seventh.body)).toEqual(['criteria_limit']);

    const quiet = s.criteria.find((c) => c.name === 'Sessizlik')!;
    await http()
      .delete(`/v1/admin/categories/${glampingId}/criteria/${quiet.id}`)
      .set(as(admin))
      .expect(204);
    await http()
      .post(`/v1/admin/categories/${glampingId}/criteria`)
      .set(as(admin))
      .send({ name: 'Manzara' })
      .expect(201);
  });
});
