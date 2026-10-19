import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AdminDashboard, AnalyticsOverview, RevenueReport } from '@incelemeler/contracts';
import { RetentionService } from '../src/modules/privacy/retention.service.js';
import { SearchIndexerService } from '../src/modules/search/search-indexer.service.js';
import { seedDemoListings } from '../src/seed/demo-listings.js';
import { seedSearchDefaults } from '../src/seed/seed-search.js';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { nextIp, staffToken } from './staff.js';

let t: TestContext;
let admin: string;
let sales: string;
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}`, 'X-Forwarded-For': nextIp() });
const BROWSER = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0 Safari/537.36';
const A1 = '0b6f3c1e-5d2a-4f7b-9c8e-1a2b3c4d5e61';
const A2 = '0b6f3c1e-5d2a-4f7b-9c8e-1a2b3c4d5e62';
const S1 = '1b6f3c1e-5d2a-4f7b-9c8e-1a2b3c4d5e61';
const S2 = '1b6f3c1e-5d2a-4f7b-9c8e-1a2b3c4d5e62';
const send = (
  anonymousId: string,
  event: Record<string, unknown>,
  headers: Record<string, string> = { 'User-Agent': BROWSER },
) =>
  http()
    .post('/v1/analytics/events')
    .set({ 'X-Forwarded-For': nextIp(), ...headers })
    .send({ anonymousId, event: { sessionId: S1, path: '/', props: {}, ...event } });
const overview = async (days = 7) =>
  AnalyticsOverview.parse(
    (await http().get('/v1/admin/analytics/overview').query({ days }).set(as(admin)).expect(200))
      .body,
  );

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  await seedSearchDefaults(t.prisma);
  await seedDemoListings(t.prisma);
  await t.app.get(SearchIndexerService).reindexAll();
  admin = await staffToken(t, 'analitik-yonetici@example.com', ['ADMIN']);
  sales = await staffToken(t, 'analitik-satis@example.com', ['SALES']);
}, 120_000);

afterAll(async () => {
  await t?.close();
});

describe('analitik (REQ-ANL-001…006, REQ-ADM-002/010)', () => {
  it('[REQ-ANL-004] veri yokken panolar null ("Veri yok") döner; sabit/örnek sayı yok', async () => {
    const o = await overview();
    expect(o).toMatchObject({
      activeVisitors: null,
      qualifiedSessions: null,
      applications: null,
      sponsored: { served: null, viewed: null, clicks: null },
      outbound: { total: null },
      searches: { total: null, zeroRate: null, top: [] },
      favoritesAdded: null,
    });
    expect(Date.now() - Date.parse(o.generatedAt)).toBeLessThan(60_000);
  });

  it('[REQ-ANL-001] [REQ-ANL-005] olay alımı: sözlük doğrulaması; bot, otomasyon ve personel işaretlenir', async () => {
    await send(A1, { name: 'landing', props: { source: 'search' } }).expect(202);
    await send(A1, {
      name: 'listing_viewed',
      path: '/mekan/ornek',
      props: { listingId: A2, kind: 'PLACE' },
    }).expect(202);
    await send(A1, { name: 'engaged_30s', props: { pageType: 'listing' } }).expect(202);
    await send(A2, { name: 'landing', sessionId: S2, props: { source: 'direct' } }).expect(202);
    // Ayıklananlar: bot UA, otomasyon, personel, demo.
    await send(
      A2,
      { name: 'landing', props: { source: 'social' } },
      { 'User-Agent': 'Googlebot/2.1' },
    ).expect(202);
    await send(A2, { name: 'landing', props: { source: 'social' }, automated: true }).expect(202);
    await send(
      A2,
      { name: 'favorite_added', sessionId: S2, props: { listingId: A1 } },
      { 'User-Agent': BROWSER, Authorization: `Bearer ${admin}` },
    ).expect(202);
    await send(A2, {
      name: 'engaged_30s',
      sessionId: S2,
      props: { pageType: 'content' },
      demo: true,
    }).expect(202);
    // Sözlük dışı olay ve sorgu dizeli yol reddedilir.
    await send(A1, { name: 'email_seen', props: {} }).expect(422);
    await send(A1, {
      name: 'landing',
      path: '/ara?q=05551112233',
      props: { source: 'direct' },
    }).expect(422);
    const rows = await t.prisma.analyticsEvent.findMany();
    expect(rows.filter((r) => r.bot)).toHaveLength(2);
    expect(rows.filter((r) => r.staff)).toHaveLength(1);
    expect(rows.filter((r) => r.demo)).toHaveLength(1);
    expect(JSON.stringify(rows, (_k, v: unknown) => (typeof v === 'bigint' ? 0 : v))).not.toMatch(
      /203\.0|10\.1\.|Mozilla/,
    );
  });

  it('[REQ-ANL-004] panolar gerçek kayıtlardan; kuzey yıldızı ve sorgu k-anonimliği', async () => {
    for (const q of [
      'kahvaltı',
      'kahvaltı',
      'kahvaltı',
      'xyzqw',
      'xyzqw',
      'xyzqw',
      'tekil sorgu',
    ]) {
      await http().get('/v1/search').query({ q }).set('X-Forwarded-For', nextIp()).expect(200);
    }
    const o = await overview();
    expect(o.activeVisitors).toBe(2); // A1, A2 (yalnızca gerçek olayları olan)
    expect(o.qualifiedSessions).toBe(1); // S1: engaged_30s; S2'ninkiler personel/demo
    expect(o.landings).toEqual(
      expect.arrayContaining([
        { source: 'search', count: 1 },
        { source: 'direct', count: 1 },
      ]),
    );
    expect(o.landings.find((l) => l.source === 'social')).toBeUndefined();
    expect(o.searches.total).toBe(7);
    expect(o.searches.top.map((x) => x.query)).toEqual(
      expect.arrayContaining(['kahvalti', 'xyzqw']),
    );
    expect(o.searches.top.map((x) => x.query)).not.toContain('tekil sorgu');
    expect(o.searches.topZero.map((x) => x.query)).toEqual(['xyzqw']);
    expect(o.searches.zeroRate).toBeCloseTo(4 / 7, 3);
    expect(o.content.publishedListings.length).toBeGreaterThan(0);
    await http().get('/v1/admin/analytics/overview').query({ days: 3 }).set(as(admin)).expect(422);
    await http().get('/v1/admin/analytics/overview').set(as(sales)).expect(403);
  });

  it('[REQ-ADM-002] genel pano: bekleyen işler ve son 7 gün (gerçek sayaçlar)', async () => {
    const d = AdminDashboard.parse(
      (await http().get('/v1/admin/dashboard').set(as(sales)).expect(200)).body,
    );
    expect(d).toMatchObject({
      pendingModeration: 0,
      activeCampaigns: 0,
      applications: null,
      last7Days: { searches: 7, outboundClicks: 0 },
    });
    expect(d.staleListings).toBeGreaterThan(0);
  });

  it('[REQ-ADM-010] gelir raporu: yalnızca elle girilen tutarlar; affiliate verisi yok; yalnızca yönetici', async () => {
    const org = await t.prisma.organization.create({
      data: { type: 'ADVERTISER', slug: 'gelir-test', name: 'Gelir Testi Reklamvereni' },
    });
    await t.prisma.campaign.create({
      data: {
        name: 'Ekim kampanyası',
        sponsorId: org.id,
        status: 'COMPLETED',
        startsAt: new Date('2026-10-01T00:00:00+03:00'),
        endsAt: new Date('2026-10-15T00:00:00+03:00'),
        budgetKurus: 1_250_000n,
      },
    });
    await t.prisma.campaign.create({
      data: {
        name: 'Taslak kampanya',
        sponsorId: org.id,
        startsAt: new Date('2026-10-01T00:00:00+03:00'),
        endsAt: new Date('2026-10-15T00:00:00+03:00'),
        budgetKurus: 9_999n,
      },
    });
    const q = { from: '2026-10-01', to: '2026-10-31' };
    await http().get('/v1/admin/reports/revenue').query(q).set(as(sales)).expect(403);
    const r = RevenueReport.parse(
      (await http().get('/v1/admin/reports/revenue').query(q).set(as(admin)).expect(200)).body,
    );
    expect(r.sponsorship).toHaveLength(1);
    expect(r.sponsorship[0]).toMatchObject({ amountKurus: 1_250_000, source: 'MANUAL_CONTRACT' });
    expect(r).toMatchObject({
      sponsorshipTotalKurus: 1_250_000,
      affiliateEstimatedKurus: null,
      affiliateConfirmedKurus: null,
    });
  });

  it('[REQ-ANL-006] saklama sonunda olaylar günlük toplama dönüşür ve silinir', async () => {
    const old = new Date(Date.now() - 430 * 86_400_000);
    await t.prisma.analyticsEvent.createMany({
      data: [
        { createdAt: old, name: 'landing', anonymousId: A1, sessionId: S1, path: '/' },
        { createdAt: old, name: 'landing', anonymousId: A2, sessionId: S2, path: '/' },
        { createdAt: old, name: 'landing', anonymousId: A2, sessionId: S2, path: '/', bot: true },
      ],
    });
    const out = await t.app.get(RetentionService).run();
    expect(out['analytics_events']).toBe(3);
    const daily = await t.prisma.analyticsDaily.findMany();
    expect(daily).toHaveLength(1);
    expect(daily[0]).toMatchObject({ name: 'landing', count: 2 });
    expect(
      await t.prisma.analyticsEvent.count({
        where: { createdAt: { lt: new Date(Date.now() - 400 * 86_400_000) } },
      }),
    ).toBe(0);
  });
});
