import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import jpeg from 'jpeg-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PublicListing, SitemapPage, SlugResolution } from '@incelemeler/contracts';
import { createApp } from '../src/bootstrap.js';
import { MemoryEmailAdapter } from '../src/modules/notifications/email.port.js';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';

let t: TestContext;
let prod: INestApplication;
const http = () => request(t.app.getHttpServer());
const ids: Record<string, string> = {};

async function listing(
  slug: string,
  data: Partial<{
    status: string;
    dataOrigin: string;
    deletedAt: Date;
    publishedAt: Date | null;
  }> = {},
) {
  const row = await t.prisma.listing.create({
    data: {
      kind: 'PLACE',
      slug,
      name: slug,
      primaryCategoryId: ids.restoranlar!,
      dataOrigin: (data.dataOrigin ?? 'EDITORIAL') as 'EDITORIAL',
      source: 'Editör girişi',
      status: (data.status ?? 'PUBLISHED') as 'PUBLISHED',
      publishedAt: data.publishedAt === undefined ? new Date() : data.publishedAt,
      deletedAt: data.deletedAt ?? null,
      attributes: { cuisine: 'deniz', terrace: true },
      contacts: { phone: '+90 216 000 00 00' },
      location: {
        create: {
          provinceId: ids.istanbul!,
          districtId: ids.kadikoy!,
          latitude: 40.99,
          longitude: 29.03,
        },
      },
    },
  });
  return row.id;
}

async function media(licensed: boolean) {
  const jpg = Buffer.from(
    jpeg.encode({ data: Buffer.alloc(8 * 6 * 4, 200), width: 8, height: 6 }, 80).data,
  );
  const id = crypto.randomUUID();
  const key = `media/${id}/original.jpg`;
  await t.storage.put(key, jpg, 'image/jpeg');
  const uploader = await t.prisma.user.findFirstOrThrow();
  await t.prisma.mediaAsset.create({
    data: {
      id,
      storageKey: key,
      mime: 'image/jpeg',
      bytes: jpg.length,
      width: 8,
      height: 6,
      altText: 'Teras',
      exifStripped: true,
      sha256: 'x',
      uploadedById: uploader.id,
      dataOrigin: 'EDITORIAL',
      ...(licensed
        ? { sourceType: 'EDITOR' as const, rightsHolder: 'Editör ekibi', licenseType: 'Kurum içi' }
        : {}),
    },
  });
  return id;
}

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  ids.restoranlar = (
    await t.prisma.category.findUniqueOrThrow({ where: { slug: 'restoranlar' } })
  ).id;
  const istanbul = await t.prisma.adminArea.findFirstOrThrow({ where: { code: '34' } });
  ids.istanbul = istanbul.id;
  ids.kadikoy = (
    await t.prisma.adminArea.findFirstOrThrow({ where: { parentId: istanbul.id, slug: 'kadikoy' } })
  ).id;
  await t.prisma.user.create({
    data: {
      email: 'yukleyen@example.com',
      passwordHash: 'x',
      displayName: 'Yükleyen',
      ageConfirmedAt: new Date(),
      termsVersion: 't',
    },
  });
  // Şema: etiketli gösterim için iki özellik.
  const cat = ids.restoranlar;
  await t.prisma.attributeDefinition.createMany({
    data: [
      {
        categoryId: cat,
        key: 'cuisine',
        label: 'Mutfak',
        type: 'ENUM',
        options: [
          { value: 'deniz', label: 'Deniz ürünleri' },
          { value: 'turk', label: 'Türk' },
        ],
      },
      { categoryId: cat, key: 'terrace', label: 'Teras', type: 'BOOL' },
    ],
  });
  ids.published = await listing('acik-lokanta');
  ids.licensed = await media(true);
  ids.unlicensed = await media(false);
  await t.prisma.mediaUsage.createMany({
    data: [
      { mediaId: ids.licensed, entityType: 'listing', entityId: ids.published, role: 'PRIMARY' },
      {
        mediaId: ids.unlicensed,
        entityType: 'listing',
        entityId: ids.published,
        role: 'GALLERY',
        sortOrder: 1,
      },
    ],
  });
  ids.draft = await listing('taslak-lokanta', { status: 'DRAFT', publishedAt: null });
  ids.closed = await listing('kapanmis-lokanta', { status: 'CLOSED_PERMANENTLY' });
  ids.demo = await listing('ornek-lokanta-demo', { dataOrigin: 'DEMO' });
  ids.moved = await listing('yeni-adres');
  await t.prisma.slugHistory.create({
    data: { entityType: 'listing', entityId: ids.moved, slug: 'eski-adres' },
  });
  ids.deleted = await listing('silinmis-lokanta', { deletedAt: new Date() });

  prod = await createApp(
    { ...t.env, APP_ENV: 'production' },
    { emailPort: new MemoryEmailAdapter(), storagePort: t.storage },
  );
  await prod.init();
});

afterAll(async () => {
  await prod?.close();
  await t?.close();
});

describe('herkese açık listeleme (REQ-SEO-001, REQ-LST-002, REQ-LST-006)', () => {
  it('[REQ-LST-002] yayındaki listeleme: etiketli özellikler, yalnızca lisanslı görsel, değerlendirme 0', async () => {
    const res = await http().get('/v1/listings/acik-lokanta').expect(200);
    expect(res.headers['cache-control']).toBe('public, max-age=60');
    const l = PublicListing.parse(res.body);
    expect(l.attributes.map((a) => [a.label, a.display])).toEqual([
      ['Mutfak', 'Deniz ürünleri'],
      ['Teras', 'Evet'],
    ]);
    expect(l.media.map((m) => m.id)).toEqual([ids.licensed]);
    expect(l.media[0]).toMatchObject({ role: 'PRIMARY', credit: 'Editör ekibi', altText: 'Teras' });
    expect(l.reviewCount).toBe(0);
    expect(l.location?.district?.name).toBe('Kadıköy');
  });

  it('[REQ-LST-006] taslak 404; kapalı listeleme sayfası korunur', async () => {
    await http().get('/v1/listings/taslak-lokanta').expect(404);
    const closed = PublicListing.parse(
      (await http().get('/v1/listings/kapanmis-lokanta').expect(200)).body,
    );
    expect(closed.status).toBe('CLOSED_PERMANENTLY');
  });

  it('[REQ-VER-013] [REQ-SEO-012] slug çözümü: güncel, taşınmış, kaldırılmış, yok', async () => {
    const resolve = async (slug: string) =>
      SlugResolution.parse(
        (await http().get(`/v1/listings/resolve?slug=${slug}`).expect(200)).body,
      );
    expect(await resolve('acik-lokanta')).toMatchObject({ status: 'ok', kind: 'PLACE' });
    expect(await resolve('eski-adres')).toMatchObject({ status: 'moved', slug: 'yeni-adres' });
    expect(await resolve('silinmis-lokanta')).toMatchObject({ status: 'gone' });
    expect(await resolve('taslak-lokanta')).toMatchObject({ status: 'missing' });
    expect(await resolve('hic-olmayan')).toMatchObject({ status: 'missing' });
  });

  it('[REQ-VER-014] görsel yalnızca lisanslı ve herkese açık listelemeye bağlıysa sunulur', async () => {
    const ok = await http().get(`/v1/media/${ids.licensed}`).expect(200);
    expect(ok.headers['content-type']).toBe('image/jpeg');
    await http().get(`/v1/media/${ids.unlicensed}`).expect(404);
  });

  it('[REQ-SEO-006] site haritası: demo, kapalı, taslak ve silinmiş listelemeler yok', async () => {
    const page = SitemapPage.parse((await http().get('/v1/sitemap/listings').expect(200)).body);
    expect(page.data.map((e) => e.slug).sort()).toEqual(['acik-lokanta', 'yeni-adres']);
  });

  it('[REQ-VER-018] üretimde DEMO listeleme hiçbir yüzeyde dönmez', async () => {
    await http().get('/v1/listings/ornek-lokanta-demo').expect(200);
    const p = () => request(prod.getHttpServer());
    await p().get('/v1/listings/ornek-lokanta-demo').expect(404);
    expect(
      SlugResolution.parse(
        (await p().get('/v1/listings/resolve?slug=ornek-lokanta-demo').expect(200)).body,
      ).status,
    ).toBe('missing');
  });
});
