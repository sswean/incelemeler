import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  OutboundLink,
  OutboundLinkList,
  Problem,
  Provider,
  PublicListing,
  SearchResponse,
} from '@incelemeler/contracts';
import { OutboxService } from '../src/modules/outbox/outbox.service.js';
import { SearchIndexerService } from '../src/modules/search/search-indexer.service.js';
import { seedDemoListings } from '../src/seed/demo-listings.js';
import { seedSearchDefaults } from '../src/seed/seed-search.js';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { nextIp, staffToken } from './staff.js';

let t: TestContext;
let admin: string;
let editor: string;
let provider: ReturnType<typeof Provider.parse>;
let lodgingId: string;
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}`, 'X-Forwarded-For': nextIp() });
const codes = (body: unknown) => Problem.parse(body).errors?.map((e) => e.code);
const BROWSER = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0 Safari/537.36';
const SLUG = 'ornek-konyaalti-sahil-oteli-demo';
const linkBody = (extra: Record<string, unknown> = {}) => ({
  listingId: lodgingId,
  providerId: provider.id,
  kind: 'AFFILIATE',
  ctaType: 'PROVIDER_PRICES',
  urlTemplate: 'https://www.ornek-otel.example/otel/konyaalti?sub={subId}&s={surface}',
  commercialRelation: 'AFFILIATE',
  ...extra,
});
const listing = async () =>
  PublicListing.parse((await http().get(`/v1/listings/${SLUG}`).expect(200)).body);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  await seedSearchDefaults(t.prisma);
  await seedDemoListings(t.prisma);
  await t.app.get(SearchIndexerService).reindexAll();
  admin = await staffToken(t, 'dis-yonetici@example.com', ['ADMIN']);
  editor = await staffToken(t, 'dis-editor@example.com', ['EDITOR']);
  lodgingId = (await t.prisma.listing.findUniqueOrThrow({ where: { slug: SLUG } })).id;
}, 120_000);

afterAll(async () => {
  await t?.close();
});

describe('dış yönlendirme (REQ-AFF-001…007)', () => {
  let link: OutboundLink;

  it('[REQ-AFF-001] sağlayıcı kaydı (API varsayılmaz: LINK_ONLY) ve ticari bağlantı kuralları', async () => {
    await http()
      .post('/v1/admin/integration-providers')
      .set(as(editor))
      .send({ key: 'ornek-otel', name: 'Örnek Otel Ağı', allowedDomains: ['ornek-otel.example'] })
      .expect(403);
    provider = Provider.parse(
      (
        await http()
          .post('/v1/admin/integration-providers')
          .set(as(admin))
          .send({
            key: 'ornek-otel',
            name: 'Örnek Otel Ağı',
            allowedDomains: ['Ornek-Otel.example'],
          })
          .expect(201)
      ).body,
    );
    expect(provider).toMatchObject({
      integrationStatus: 'LINK_ONLY',
      allowedDomains: ['ornek-otel.example'],
    });
    // Editör ticari bağlantı ekleyemez (affiliate yetkisi yok).
    await http().post('/v1/admin/outbound-links').set(as(editor)).send(linkBody()).expect(403);
    const bad = async (extra: Record<string, unknown>) =>
      codes(
        (
          await http()
            .post('/v1/admin/outbound-links')
            .set(as(admin))
            .send(linkBody(extra))
            .expect(422)
        ).body,
      );
    expect(await bad({ ctaType: 'BUY' })).toContain('cta_not_allowed');
    expect(await bad({ urlTemplate: 'https://ornek-otel.example/?e={email}' })).toContain(
      'template_variable',
    );
    expect(await bad({ urlTemplate: 'https://baska.example/otel' })).toContain(
      'domain_not_allowed',
    );
    expect(await bad({ providerId: null })).toContain('provider_required');
    expect(await bad({ commercialRelation: 'NONE' })).toContain('affiliate_relation');
    link = OutboundLink.parse(
      (await http().post('/v1/admin/outbound-links').set(as(admin)).send(linkBody()).expect(201))
        .body,
    );
    expect(link).toMatchObject({
      status: 'ACTIVE',
      kind: 'AFFILIATE',
      source: 'MANUAL',
      clicks30d: 0,
    });
    expect(await t.prisma.auditLog.count({ where: { action: 'outbound.link.created' } })).toBe(1);
  });

  it('[REQ-AFF-002] [REQ-AFF-003] [REQ-AFF-006] sayfa yalnızca /git/ yolunu görür; hedef kayıttan, alt kimlik şablonla', async () => {
    const l = await listing();
    const out = l.outbound.find((o) => o.id === link.id)!;
    expect(out).toMatchObject({
      ctaType: 'PROVIDER_PRICES',
      commercialRelation: 'AFFILIATE',
      providerName: 'Örnek Otel Ağı',
    });
    expect(out.href).toMatch(new RegExp(`^/git/${link.id}\\?ctx=`));
    expect(JSON.stringify(l)).not.toContain('ornek-otel.example');
    const ctx = decodeURIComponent(out.href.split('ctx=')[1]!);
    const res = await http()
      .get(`/v1/outbound/${link.id}/resolve`)
      .query({ ctx })
      .set({ 'User-Agent': BROWSER, 'X-Forwarded-For': '203.0.113.7' })
      .expect(200);
    expect(res.body.url).toBe(
      `https://www.ornek-otel.example/otel/konyaalti?sub=ldp-${SLUG}&s=listing_detail`,
    );
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['x-robots-tag']).toBe('noindex');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    // İstekten gelen adres asla kullanılmaz: bilinmeyen parametre reddedilir.
    await http()
      .get(`/v1/outbound/${link.id}/resolve`)
      .query({ url: 'https://evil.example' })
      .expect(400);
  });

  it('[REQ-AFF-005] [REQ-KVK-013] [REQ-ANL-003] tıklama (çerezsiz, sunucu tarafı): ham IP yok, 30 sn tekilleştirme, bot ve önceden getirme sayılmaz', async () => {
    await sleep(300); // önceki testin yanıtı bekletmeden yazılan tıklama kaydı otursun
    await t.prisma.outboundClick.deleteMany();
    const hit = (headers: Record<string, string>) =>
      http()
        .get(`/v1/outbound/${link.id}/resolve`)
        .set({ 'X-Forwarded-For': '203.0.113.8', ...headers })
        .expect(200);
    await hit({ 'User-Agent': BROWSER });
    await hit({ 'User-Agent': BROWSER });
    await hit({ 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' });
    await hit({ 'User-Agent': BROWSER, 'Sec-Purpose': 'prefetch' });
    await sleep(200);
    const clicks = await t.prisma.outboundClick.findMany({ orderBy: { id: 'asc' } });
    // Kayıtlar yanıtı bekletmeden yazılır; sıra değil sonuç doğrulanır: tam bir sayılan tıklama.
    expect(clicks.map((c) => [c.counted, c.bot, c.prefetch]).sort()).toEqual(
      [
        [true, false, false],
        [false, false, false],
        [false, true, false],
        [false, false, true],
      ].sort(),
    );
    expect(clicks[0]!.sessionHash).toMatch(/^[0-9a-f]{64}$/);
    expect(
      JSON.stringify(clicks, (_k, v: unknown) => (typeof v === 'bigint' ? v.toString() : v)),
    ).not.toContain('203.0.113.8');
    expect(clicks[0]!.surface).toBe('unknown'); // ctx yok
    const listed = OutboundLinkList.parse(
      (
        await http()
          .get(`/v1/admin/listings/${lodgingId}/outbound-links`)
          .set(as(editor))
          .expect(200)
      ).body,
    );
    expect(listed.data.find((x) => x.id === link.id)?.clicks30d).toBe(1);
  });

  it('[REQ-AFF-005] eşzamanlı aynı tıklamalar tek sayılır (denetle-sonra-yaz yarışı yok)', async () => {
    await sleep(300);
    await t.prisma.outboundClick.deleteMany();
    await Promise.all(
      Array.from({ length: 6 }, () =>
        http()
          .get(`/v1/outbound/${link.id}/resolve`)
          .set({ 'X-Forwarded-For': '203.0.113.9', 'User-Agent': BROWSER })
          .expect(200),
      ),
    );
    await expect
      .poll(() => t.prisma.outboundClick.count({ where: { linkId: link.id } }), { timeout: 3000 })
      .toBe(6);
    expect(await t.prisma.outboundClick.count({ where: { linkId: link.id, counted: true } })).toBe(
      1,
    );
  });

  it('[REQ-AFF-002] kayıttaki hedef izinli alan dışına çıkarsa yönlendirme yapılmaz ve alarm üretilir', async () => {
    await t.prisma.outboundLink.update({
      where: { id: link.id },
      data: { urlTemplate: 'https://evil.example/' },
    });
    await http().get(`/v1/outbound/${link.id}/resolve`).set({ 'User-Agent': BROWSER }).expect(404);
    const alarm = await t.prisma.auditLog.findFirst({
      where: { action: 'outbound.blocked', targetId: link.id },
    });
    expect(alarm?.summary).toEqual({ reason: 'domain_not_allowed' });
    await t.prisma.outboundLink.update({
      where: { id: link.id },
      data: { urlTemplate: linkBody().urlTemplate },
    });
  });

  it('[REQ-AFF-007] süresi dolan bağlantı kapanır; sağlık denetimi özel adreslere istek atmaz (SSRF)', async () => {
    await t.prisma.outboundLink.update({
      where: { id: link.id },
      data: { validUntil: new Date(Date.now() - 1000) },
    });
    await http().get(`/v1/outbound/${link.id}/resolve`).set({ 'User-Agent': BROWSER }).expect(404);
    expect((await t.prisma.outboundLink.findUniqueOrThrow({ where: { id: link.id } })).status).toBe(
      'EXPIRED',
    );
    expect((await listing()).outbound.some((o) => o.id === link.id)).toBe(false);

    const local = Provider.parse(
      (
        await http()
          .post('/v1/admin/integration-providers')
          .set(as(admin))
          .send({ key: 'yerel-deneme', name: 'Yerel Deneme', allowedDomains: ['localhost'] })
          .expect(201)
      ).body,
    );
    const l = OutboundLink.parse(
      (
        await http()
          .post('/v1/admin/outbound-links')
          .set(as(admin))
          .send(linkBody({ providerId: local.id, urlTemplate: 'https://localhost/admin' }))
          .expect(201)
      ).body,
    );
    const checked = OutboundLink.parse(
      (await http().post(`/v1/admin/outbound-links/${l.id}/check`).set(as(admin)).expect(200)).body,
    );
    expect(checked).toMatchObject({ status: 'BROKEN', lastCheckStatus: 'blocked:private_address' });
  });

  it('[REQ-AFF-001] iletişim bilgisindeki web sitesi kayda eşitlenir; kaldırılınca devre dışı', async () => {
    const cat = await t.prisma.category.findUniqueOrThrow({ where: { slug: 'restoranlar' } });
    const created = await http()
      .post('/v1/admin/listings')
      .set(as(editor))
      .send({
        kind: 'PLACE',
        name: 'Dış Bağlantı Lokantası',
        primaryCategoryId: cat.id,
        source: 'Editör ziyareti',
        contacts: { website: 'http://www.dis-baglanti.example/menu' },
      })
      .expect(201);
    await t.app.get(OutboxService).runOnce(100);
    let links = OutboundLinkList.parse(
      (
        await http()
          .get(`/v1/admin/listings/${created.body.id}/outbound-links`)
          .set(as(editor))
          .expect(200)
      ).body,
    );
    expect(links.data).toEqual([
      expect.objectContaining({
        source: 'CONTACTS',
        ctaType: 'WEBSITE',
        commercialRelation: 'NONE',
        allowedDomain: 'www.dis-baglanti.example',
        status: 'ACTIVE',
      }),
    ]);
    await http()
      .patch(`/v1/admin/listings/${created.body.id}`)
      .set(as(editor))
      .send({ version: created.body.version, contacts: {} })
      .expect(200);
    await t.app.get(OutboxService).runOnce(100);
    links = OutboundLinkList.parse(
      (
        await http()
          .get(`/v1/admin/listings/${created.body.id}/outbound-links`)
          .set(as(editor))
          .expect(200)
      ).body,
    );
    expect(links.data[0]!.status).toBe('DISABLED');
  });

  it('[REQ-AFF-009] affiliate bağlantısı organik sıralamayı değiştirmez', async () => {
    const order = async () =>
      SearchResponse.parse(
        (
          await http()
            .get('/v1/search')
            .query({ province: 'antalya', category: 'konaklama' })
            .expect(200)
        ).body,
      ).data.map((h) => h.id);
    const before = await order();
    await http()
      .post('/v1/admin/outbound-links')
      .set(as(admin))
      .send(linkBody({ ctaType: 'WEBSITE' }))
      .expect(201);
    await t.app.get(SearchIndexerService).indexListing(lodgingId);
    expect(await order()).toEqual(before);
  });
});
