import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Hub, HubSitemap, Problem, ThresholdsResponse } from '@incelemeler/contracts';
import { RESERVED_SEGMENTS } from '@incelemeler/routes';
import { HubsService } from '../src/modules/hubs/hubs.service.js';
import { SearchIndexerService } from '../src/modules/search/search-indexer.service.js';
import { seedDemoListings } from '../src/seed/demo-listings.js';
import { seedSearchDefaults } from '../src/seed/seed-search.js';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { staffToken } from './staff.js';

let t: TestContext;
let admin: string;
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}` });
const hub = async (query: Record<string, string>) =>
  Hub.parse((await http().get('/v1/hubs').query(query).expect(200)).body);

async function setThresholds(values: Record<string, number>) {
  const current = ThresholdsResponse.parse(
    (await http().get('/v1/admin/settings/thresholds').set(as(admin)).expect(200)).body,
  );
  const { version, ...rest } = current;
  return ThresholdsResponse.parse(
    (
      await http()
        .put('/v1/admin/settings/thresholds')
        .set(as(admin))
        .send({ ...rest, ...values, version })
        .expect(200)
    ).body,
  );
}

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  await seedSearchDefaults(t.prisma);
  await seedDemoListings(t.prisma);
  await t.app.get(SearchIndexerService).reindexAll();
  admin = await staffToken(t, 'hub-yonetici@example.com', ['ADMIN']);
}, 120_000);

afterAll(async () => {
  await t?.close();
});

describe('hub sayfaları ve yayın eşikleri (§7.2, REQ-KAT-003)', () => {
  it('[REQ-KAT-003] varsayılan eşiklerin altında hub üretilmez (404) ve site haritasında yok', async () => {
    const thresholds = ThresholdsResponse.parse(
      (await http().get('/v1/admin/settings/thresholds').set(as(admin)).expect(200)).body,
    );
    expect(thresholds).toMatchObject({ provinceCategoryListings: 30, provinceCategoryArticles: 1 });
    await http()
      .get('/v1/hubs')
      .query({ province: 'istanbul', segment: 'kahvalti-mekanlari' })
      .expect(404);
    await http().get('/v1/hubs').query({ province: 'istanbul' }).expect(404);
    const sitemap = HubSitemap.parse((await http().get('/v1/sitemap/hubs').expect(200)).body);
    expect(sitemap.data).toEqual([]);
  });

  it('[REQ-KAT-003] eşikler panelden ayarlanır; sürüm denetimli ve denetim kaydına girer', async () => {
    const editor = await staffToken(t, 'hub-editor@example.com', ['EDITOR']);
    await http().get('/v1/admin/settings/thresholds').set(as(editor)).expect(403);
    const updated = await setThresholds({
      provinceCategoryListings: 3,
      provinceCategoryArticles: 0,
      districtCategoryListings: 2,
      districtListings: 2,
      provinceGuides: 0,
      provinceHubs: 1,
    });
    expect(updated.version).toBe(1);
    // Eski sürümle yazım reddedilir.
    await http()
      .put('/v1/admin/settings/thresholds')
      .set(as(admin))
      .send({ ...updated, version: 0 })
      .expect(412);
    const log = await t.prisma.auditLog.findFirst({
      where: { action: 'settings.thresholds.updated' },
    });
    expect(log?.summary).toMatchObject({ after: { provinceCategoryListings: 3 } });
  });

  it('[REQ-SEO-011] il × kategori hub: organik listelemeler, alt hub bağlantıları, üst hub', async () => {
    const h = await hub({ province: 'istanbul', segment: 'kahvalti-mekanlari' });
    expect(h).toMatchObject({
      kind: 'PROVINCE_CATEGORY',
      path: '/istanbul/kahvalti-mekanlari',
      province: { slug: 'istanbul', name: 'İstanbul' },
      category: { slug: 'kahvalti-mekanlari' },
      listingCount: 5,
      demoOnly: true,
    });
    expect(h.listings).toHaveLength(5);
    expect(h.listings.every((l) => l.path.startsWith('/mekan/'))).toBe(true);
    expect(h.parents.map((p) => p.path)).toEqual(['/istanbul']);
    // Üst kategori (Yeme-İçme) hub'ı alt kategori hub'larına bağlanır.
    const parent = await hub({ province: 'istanbul', segment: 'yeme-icme' });
    expect(parent.children.map((c) => c.path)).toContain('/istanbul/kahvalti-mekanlari');
  });

  it('[REQ-SEO-003] ilçe ve ilçe × kategori hub; bilinmeyen/eşik altı 404', async () => {
    const kadikoy = await hub({ province: 'istanbul', segment: 'kadikoy' });
    expect(kadikoy).toMatchObject({ kind: 'DISTRICT', listingCount: 3 });
    expect(kadikoy.children.map((c) => c.path)).toContain('/istanbul/kadikoy/yeme-icme');
    const dc = await hub({ province: 'istanbul', segment: 'kadikoy', category: 'yeme-icme' });
    expect(dc).toMatchObject({ kind: 'DISTRICT_CATEGORY', path: '/istanbul/kadikoy/yeme-icme' });
    expect(dc.parents.map((p) => p.path)).toEqual([
      '/istanbul',
      '/istanbul/kadikoy',
      '/istanbul/yeme-icme',
    ]);
    // 1 listeleme < 2 eşik
    await http().get('/v1/hubs').query({ province: 'istanbul', segment: 'sisli' }).expect(404);
    await http().get('/v1/hubs').query({ province: 'istanbul', segment: 'oteller' }).expect(404);
    await http().get('/v1/hubs').query({ province: 'atlantis' }).expect(404);
    await http()
      .get('/v1/hubs')
      .query({ province: 'istanbul', segment: 'kahvalti-mekanlari', category: 'kafeler' })
      .expect(404);
  });

  it('[REQ-ICR-003] editoryal içerik eşiği: hub listelemelerini gömen yayımlanmış içerik sayılır', async () => {
    await setThresholds({ provinceCategoryArticles: 1, provinceGuides: 1 });
    await http()
      .get('/v1/hubs')
      .query({ province: 'istanbul', segment: 'kahvalti-mekanlari' })
      .expect(404);
    const listing = await t.prisma.listing.findUniqueOrThrow({
      where: { slug: 'ornek-kahvalti-evi-cihangir-demo' },
    });
    const author = await t.prisma.user.findUniqueOrThrow({
      where: { email: 'hub-yonetici@example.com' },
    });
    await t.prisma.article.create({
      data: {
        type: 'GUIDE',
        slug: 'istanbul-kahvalti-rehberi',
        title: 'İstanbul kahvaltı rehberi',
        body: [{ type: 'listingCard', listingId: listing.id }],
        status: 'PUBLISHED',
        publishedAt: new Date(),
        interestDeclared: true,
        commercialRelation: 'NONE',
        authorId: author.id,
        dataOrigin: 'EDITORIAL',
      },
    });
    // Anlık görüntü 60 sn önbellekte; test yeni içeriği hemen görmek için önbelleği boşaltır.
    (t.app.get(HubsService) as unknown as { cache: Map<string, unknown> }).cache.clear();
    const h = await hub({ province: 'istanbul', segment: 'kahvalti-mekanlari' });
    expect(h.articles.map((a) => a.slug)).toEqual(['istanbul-kahvalti-rehberi']);
    const province = await hub({ province: 'istanbul' });
    expect(province.kind).toBe('PROVINCE');
  });

  it('[REQ-SEO-006] site haritası: eşiği sağlayan hub’lar; yalnızca demo listelemeli hub yok (AK-03)', async () => {
    const sitemap = HubSitemap.parse((await http().get('/v1/sitemap/hubs').expect(200)).body);
    expect(sitemap.data).toEqual([]);
  });

  it('[REQ-SEO-003] il slug’ları ayrılmış sözcüklerle, kategori slug’ları il/ilçe adlarıyla çakışmaz', async () => {
    const areas = await t.prisma.adminArea.findMany();
    const categories = await t.prisma.category.findMany();
    const areaSlugs = new Set(areas.map((a) => a.slug));
    expect(areas.filter((a) => a.level === 'PROVINCE' && RESERVED_SEGMENTS.has(a.slug))).toEqual(
      [],
    );
    expect(categories.filter((c) => areaSlugs.has(c.slug)).map((c) => c.slug)).toEqual([]);
    // Panelden yeni kategori ilçe adıyla açılamaz.
    const res = await http()
      .post('/v1/admin/categories')
      .set(as(admin))
      .send({ name: 'Kadıköy', slug: 'kadikoy', allowedKinds: ['PLACE'] })
      .expect(409);
    expect(Problem.parse(res.body).errors?.[0]?.code).toBe('slug_reserved');
    const reserved = await http()
      .post('/v1/admin/categories')
      .set(as(admin))
      .send({ name: 'Ara', slug: 'ara', allowedKinds: ['PLACE'] })
      .expect(409);
    expect(Problem.parse(reserved.body).errors?.[0]?.code).toBe('slug_reserved');
  });
});
