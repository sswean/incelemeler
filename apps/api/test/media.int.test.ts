import request from 'supertest';
import jpeg from 'jpeg-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AdminListing, MediaAsset, Problem } from '@incelemeler/contracts';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { staffToken } from './staff.js';

let t: TestContext;
let editor: string;
let moderator: string;
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}` });

/** GPS içeren EXIF segmenti eklenmiş test JPEG'i (kurgusal veri). */
function jpegWithGps(): Buffer {
  const w = 40;
  const h = 30;
  const data = Buffer.alloc(w * h * 4, 180);
  const jpg = Buffer.from(jpeg.encode({ data, width: w, height: h }, 80).data);
  const payload = Buffer.concat([
    Buffer.from('Exif\0\0', 'binary'),
    Buffer.from('GPS 41.0082N 28.9784E'),
  ]);
  const head = Buffer.from([0xff, 0xe1, 0, 0]);
  head.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([jpg.subarray(0, 2), head, payload, jpg.subarray(2)]);
}

function upload(file: Buffer, name = 'foto.jpg', token = editor) {
  return http()
    .post('/v1/admin/media')
    .set(as(token))
    .attach('file', file, name)
    .field('altText', 'Restoranın iç mekânı');
}

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  editor = await staffToken(t, 'medya-editor@example.com', ['EDITOR']);
  moderator = await staffToken(t, 'medya-moderator@example.com', ['MODERATOR']);
});

afterAll(async () => {
  await t?.close();
});

describe('medya hattı (REQ-VER-014, REQ-GUV-008)', () => {
  let media: MediaAsset;

  it('[REQ-VER-014] JPEG yüklenir: EXIF/GPS silinir, boyut ve blurhash üretilir; lisans eksik', async () => {
    const res = await upload(jpegWithGps()).expect(201);
    media = MediaAsset.parse(res.body);
    expect(media).toMatchObject({
      mime: 'image/jpeg',
      width: 40,
      height: 30,
      exifStripped: true,
      altText: 'Restoranın iç mekânı',
      licenseComplete: false,
    });
    expect(media.blurhash).toBeTruthy();
    const stored = [...t.storage.objects.values()][0]!;
    expect(stored.body.includes(Buffer.from('GPS'))).toBe(false);
    const content = await http()
      .get(`/v1/admin/media/${media.id}/content`)
      .set(as(editor))
      .expect(200);
    expect(content.headers['content-type']).toBe('image/jpeg');
    expect(Buffer.from(content.body as Buffer).includes(Buffer.from('Exif'))).toBe(false);
  });

  it('[REQ-GUV-008] tür sihirli baytlardan doğrulanır; büyük dosya 413; yetkisiz rol 403', async () => {
    const svg = await upload(
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      'x.jpg',
    ).expect(415);
    expect(Problem.parse(svg.body).code).toBe('UNSUPPORTED_MEDIA_TYPE');
    const big = await upload(Buffer.alloc(10 * 1024 * 1024 + 1, 0xff), 'buyuk.jpg').expect(413);
    expect(Problem.parse(big.body).code).toBe('PAYLOAD_TOO_LARGE');
    await upload(jpegWithGps(), 'foto.jpg', moderator).expect(403);
  });

  it('[REQ-VER-014] lisansı eksik görselli listeleme yayımlanamaz; lisans tamamlanınca engel kalkar', async () => {
    const restoranlar = await t.prisma.category.findUniqueOrThrow({
      where: { slug: 'restoranlar' },
    });
    const istanbul = await t.prisma.adminArea.findFirstOrThrow({ where: { code: '34' } });
    const kadikoy = await t.prisma.adminArea.findFirstOrThrow({
      where: { parentId: istanbul.id, slug: 'kadikoy' },
    });
    const created = AdminListing.parse(
      (
        await http()
          .post('/v1/admin/listings')
          .set(as(editor))
          .send({
            kind: 'PLACE',
            name: 'Görselli Lokanta',
            primaryCategoryId: restoranlar.id,
            source: 'Editör ziyareti',
            contacts: { phone: '+90 216 000 00 00' },
            location: {
              provinceId: istanbul.id,
              districtId: kadikoy.id,
              latitude: 40.99,
              longitude: 29.03,
            },
            media: [{ mediaId: media.id, role: 'PRIMARY' }],
          })
          .expect(201)
      ).body,
    );
    expect(created.media).toHaveLength(1);
    expect(created.publishBlockers.map((b) => b.code)).toEqual(['media_license_incomplete']);

    const twoPrimary = await http()
      .patch(`/v1/admin/listings/${created.id}`)
      .set(as(editor))
      .send({
        version: created.version,
        media: [
          { mediaId: media.id, role: 'PRIMARY' },
          { mediaId: '00000000-0000-7000-8000-000000000001', role: 'PRIMARY' },
        ],
      })
      .expect(422);
    expect(Problem.parse(twoPrimary.body).errors?.map((e) => e.code)).toEqual([
      'media_primary_multiple',
      'not_found',
    ]);

    await http()
      .patch(`/v1/admin/media/${media.id}`)
      .set(as(editor))
      .send({
        version: media.version,
        sourceType: 'OWNER',
        rightsHolder: 'Görselli Lokanta',
        licenseType: 'Yazılı izin',
      })
      .expect(200);
    let listing = AdminListing.parse(
      (await http().get(`/v1/admin/listings/${created.id}`).set(as(editor)).expect(200)).body,
    );
    // İşletme görseli yazılı izin belgesi ister.
    expect(listing.publishBlockers.map((b) => b.code)).toEqual(['media_license_incomplete']);

    const current = MediaAsset.parse(
      (await http().get(`/v1/admin/media/${media.id}`).set(as(editor)).expect(200)).body,
    );
    await http()
      .patch(`/v1/admin/media/${media.id}`)
      .set(as(editor))
      .send({ version: media.version, permissionRef: 'eski' })
      .expect(412);
    const licensed = MediaAsset.parse(
      (
        await http()
          .patch(`/v1/admin/media/${media.id}`)
          .set(as(editor))
          .send({ version: current.version, permissionRef: 'İzin yazısı 2026/14' })
          .expect(200)
      ).body,
    );
    expect(licensed.licenseComplete).toBe(true);
    listing = AdminListing.parse(
      (await http().get(`/v1/admin/listings/${created.id}`).set(as(editor)).expect(200)).body,
    );
    expect(listing.publishBlockers).toEqual([]);
    expect(listing.media[0]).toMatchObject({ role: 'PRIMARY', licenseComplete: true });
  });
});
