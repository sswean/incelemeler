import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  Campaign,
  CampaignReport,
  Hub,
  ListingSponsored,
  PlacementSlotList,
  Problem,
  SearchResponse,
  SponsoredClick,
} from '@incelemeler/contracts';
import { SearchIndexerService } from '../src/modules/search/search-indexer.service.js';
import { CampaignsService } from '../src/modules/sponsorship/campaigns.service.js';
import { seedDemoListings } from '../src/seed/demo-listings.js';
import { seedSearchDefaults } from '../src/seed/seed-search.js';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { nextIp, staffToken } from './staff.js';

let t: TestContext;
let admin: string;
let sales: string;
let editor: string;
let slots: ReturnType<typeof PlacementSlotList.parse>['data'];
let campaign: Campaign;
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}`, 'X-Forwarded-For': nextIp() });
const codes = (body: unknown) => Problem.parse(body).errors?.map((e) => e.code);
const BROWSER = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0 Safari/537.36';
const SPONSORED = 'ornek-gun-isigi-kahvalti-salonu-demo';
const NEIGHBOUR = 'ornek-koy-kahvaltisi-kadikoy-demo';
const LODGING = 'ornek-kemer-koy-oteli-demo';
const QUERY = { province: 'istanbul', category: 'kahvalti-mekanlari' };
const slotId = (key: string) => slots.find((s) => s.key === key)!.id;
const search = async (q: Record<string, string> = QUERY) =>
  SearchResponse.parse((await http().get('/v1/search').query(q).expect(200)).body);
const hub = async () =>
  Hub.parse(
    (await http().get('/v1/hubs').query({ province: 'istanbul', segment: 'kahvalti-mekanlari' }))
      .body,
  );
const transition = async (token: string, action: string, status = 200) => {
  const res = await http()
    .post(`/v1/admin/campaigns/${campaign.id}/transition`)
    .set(as(token))
    .send({ action, version: campaign.version })
    .expect(status);
  if (status === 200) campaign = Campaign.parse(res.body);
  return res;
};

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  await seedSearchDefaults(t.prisma);
  await seedDemoListings(t.prisma);
  // Sayılan olayları sınamak için bir listeleme demo dışı (kurgusal ama EDITORIAL) yapılır.
  await t.prisma.listing.update({ where: { slug: SPONSORED }, data: { dataOrigin: 'EDITORIAL' } });
  await t.app.get(SearchIndexerService).reindexAll();
  admin = await staffToken(t, 'spn-yonetici@example.com', ['ADMIN']);
  sales = await staffToken(t, 'spn-satis@example.com', ['SALES']);
  editor = await staffToken(t, 'spn-editor@example.com', ['EDITOR']);
  // Hub eşikleri bu sınamada en düşük değerde.
  const th = (await http().get('/v1/admin/settings/thresholds').set(as(admin)).expect(200)).body;
  await http()
    .put('/v1/admin/settings/thresholds')
    .set(as(admin))
    .send({
      provinceCategoryListings: 1,
      provinceCategoryArticles: 0,
      districtCategoryListings: 1,
      districtListings: 1,
      provinceGuides: 0,
      provinceHubs: 1,
      version: th.version,
    })
    .expect(200);
}, 120_000);

afterAll(async () => {
  await t?.close();
});

describe('sponsorluk (REQ-SPN-001…013)', () => {
  let organicSearch: string[];
  let organicHub: string[];

  it('[REQ-SPN-004] yuva kataloğu: sınırlar yalnızca düşürülebilir', async () => {
    slots = PlacementSlotList.parse(
      (await http().get('/v1/admin/placement-slots').set(as(sales)).expect(200)).body,
    ).data;
    expect(slots.map((s) => s.key).sort()).toEqual([
      'category-list',
      'home-modules',
      'listing-detail-competitor',
      'search-results',
    ]);
    const s = slots.find((x) => x.key === 'search-results')!;
    const patch = (body: Record<string, unknown>) =>
      http()
        .patch(`/v1/admin/placement-slots/${s.id}`)
        .set(as(sales))
        .send({ version: s.version, ...body });
    expect(
      codes((await patch({ maxItems: 3, positions: [3, 13, 23] }).expect(422)).body),
    ).toContain('max_items_cap');
    expect(codes((await patch({ positions: [3, 4] }).expect(422)).body)).toContain('first_ten_cap');
    // Veritabanı da üst sınırı zorlar (panel/API dışı yazım).
    await expect(
      t.prisma.placementSlot.update({ where: { id: s.id }, data: { maxItems: 5 } }),
    ).rejects.toThrow();
    await http().patch(`/v1/admin/placement-slots/${s.id}`).set(as(editor)).expect(403);
  });

  it('[REQ-SPN-001] [REQ-SPN-013] kampanya: satış → editoryal onay → planlama; tutar yalnızca yönetici; denetim kaydı', async () => {
    organicSearch = (await search()).data.map((h) => h.id);
    organicHub = (await hub()).listings.map((h) => h.id);
    expect(organicSearch.length).toBeGreaterThanOrEqual(3);

    const org = (
      await http()
        .post('/v1/admin/organizations')
        .set(as(sales))
        .send({ type: 'ADVERTISER', name: 'Örnek Sponsor Kahvaltı Grubu' })
        .expect(201)
    ).body;
    const body = {
      name: 'Kahvaltı haftası',
      sponsorId: org.id,
      startsAt: new Date(Date.now() - 60_000).toISOString(),
      endsAt: new Date(Date.now() + 86_400_000).toISOString(),
    };
    // Satış rolü tutar giremez (Ek A8.4: tutar yalnızca yönetici).
    await http()
      .post('/v1/admin/campaigns')
      .set(as(sales))
      .send({ ...body, budgetKurus: 500_000 })
      .expect(403);
    campaign = Campaign.parse(
      (await http().post('/v1/admin/campaigns').set(as(sales)).send(body).expect(201)).body,
    );
    expect(campaign).toMatchObject({ status: 'DRAFT', budgetKurus: null });
    await http()
      .patch(`/v1/admin/campaigns/${campaign.id}`)
      .set(as(admin))
      .send({ budgetKurus: 500_000, version: campaign.version })
      .expect(200);
    const forAdmin = Campaign.parse(
      (await http().get(`/v1/admin/campaigns/${campaign.id}`).set(as(admin)).expect(200)).body,
    );
    expect(forAdmin.budgetKurus).toBe(500_000);
    campaign = Campaign.parse(
      (await http().get(`/v1/admin/campaigns/${campaign.id}`).set(as(sales)).expect(200)).body,
    );
    expect(campaign.budgetKurus).toBeNull();

    await transition(sales, 'submit', 422); // yerleşim yok
    const place = (slot: string, listingSlug: string, status = 201) =>
      http()
        .post(`/v1/admin/campaigns/${campaign.id}/placements`)
        .set(as(sales))
        .send({ slotId: slotId(slot), listingSlug })
        .expect(status);
    campaign = Campaign.parse((await place('search-results', SPONSORED)).body);
    campaign = Campaign.parse((await place('category-list', SPONSORED)).body);
    campaign = Campaign.parse((await place('listing-detail-competitor', SPONSORED)).body);
    campaign = Campaign.parse(
      (
        await http()
          .post(`/v1/admin/campaigns/${campaign.id}/creatives`)
          .set(as(sales))
          .send({ title: 'Hafta sonu serpme kahvaltı' })
          .expect(201)
      ).body,
    );
    await transition(sales, 'submit');
    expect(campaign.status).toBe('PENDING_APPROVAL');
    await transition(sales, 'approve_editorial', 403);
    await transition(sales, 'approve_sales');
    // Kreatif karara bağlanmadan editoryal onay yok.
    expect(codes((await transition(editor, 'approve_editorial', 422)).body)).toContain(
      'creative_pending',
    );
    campaign = Campaign.parse(
      (
        await http()
          .post(`/v1/admin/creatives/${campaign.creatives[0]!.id}/review`)
          .set(as(editor))
          .send({ decision: 'APPROVED', version: campaign.creatives[0]!.version })
          .expect(200)
      ).body,
    );
    await transition(editor, 'approve_editorial');
    expect(campaign.status).toBe('APPROVED');
    // Yayında değilken sunulmaz.
    expect((await search()).sponsored).toEqual([]);
    await transition(sales, 'schedule');
    expect(campaign.status).toBe('SCHEDULED');
    const actions = (
      await t.prisma.auditLog.findMany({
        where: { targetType: 'campaign', targetId: campaign.id },
        select: { action: true },
      })
    ).map((a) => a.action);
    for (const a of [
      'sponsorship.campaign.created',
      'sponsorship.campaign.updated',
      'sponsorship.placement.created',
      'sponsorship.creative.reviewed',
      'sponsorship.campaign.approve_sales',
      'sponsorship.campaign.approve_editorial',
      'sponsorship.campaign.schedule',
    ]) {
      expect(actions, a).toContain(a);
    }
  });

  it('[REQ-SPN-006] sponsorluğa kapalı kategoride yerleşim oluşturulamaz', async () => {
    const draft = Campaign.parse(
      (
        await http()
          .post('/v1/admin/campaigns')
          .set(as(sales))
          .send({
            name: 'Konaklama denemesi',
            sponsorId: campaign.sponsor.id,
            startsAt: new Date().toISOString(),
            endsAt: new Date(Date.now() + 86_400_000).toISOString(),
          })
          .expect(201)
      ).body,
    );
    const res = await http()
      .post(`/v1/admin/campaigns/${draft.id}/placements`)
      .set(as(sales))
      .send({ slotId: slotId('search-results'), listingSlug: LODGING })
      .expect(422);
    expect(codes(res.body)).toContain('sponsorship_not_allowed');
  });

  it('[REQ-SPN-002] [REQ-SPN-003] [REQ-SPN-012] sponsorlu öğe ayrı dizide, etiketli; organik dizi değişmez', async () => {
    const r = await search();
    expect(r.data.map((h) => h.id)).toEqual(organicSearch);
    expect(r.data.every((h) => h.commercial.type === 'NONE')).toBe(true);
    expect(r.sponsored).toHaveLength(1);
    const s = r.sponsored[0]!;
    expect(s.position).toBe(3);
    expect(s.item.commercial).toEqual({
      type: 'SPONSORED',
      sponsor: 'Örnek Sponsor Kahvaltı Grubu',
      label: 'Sponsorlu',
      why: expect.stringContaining('Sponsorluk puanları ve organik sıralamayı etkilemez'),
    });
    expect(s.item.subtitle).toBe('Hafta sonu serpme kahvaltı');
    expect(s.clickHref).toMatch(new RegExp(`^/git/s/${s.placementId}\\?ctx=`));
    // Belirteç yalnızca bağlamsal veri taşır (yerleşim, yüzey, demo işareti) — kişisel veri yok.
    const payload = JSON.parse(
      Buffer.from(s.impressionToken.split('.')[0]!, 'base64url').toString('utf8'),
    );
    expect(
      Object.keys(payload).filter((k) => !['pl', 's', 'd', 'exp', 'p', 'iat'].includes(k)),
    ).toEqual([]);

    const h = await hub();
    expect(h.listings.map((x) => x.id)).toEqual(organicHub);
    expect(h.sponsored.map((x) => x.placementId)).toHaveLength(1);
  });

  it('[REQ-SPN-004] alaka: sorgunun yer/kategori/metin ölçütüyle eşleşmeyen sponsorlu öğe gösterilmez', async () => {
    expect((await search({ province: 'izmir', category: 'kahvalti-mekanlari' })).sponsored).toEqual(
      [],
    );
    // Metin ölçütü: yuva 1. sıraya alınır ki pozisyon kuralı değil yalnızca alaka sınansın.
    const slot = slots.find((x) => x.key === 'search-results')!;
    const setSlot = async (positions: number[], maxItems: number) => {
      const cur = PlacementSlotList.parse(
        (await http().get('/v1/admin/placement-slots').set(as(sales)).expect(200)).body,
      ).data.find((x) => x.id === slot.id)!;
      await http()
        .patch(`/v1/admin/placement-slots/${slot.id}`)
        .set(as(sales))
        .send({ positions, maxItems, version: cur.version })
        .expect(200);
    };
    await setSlot([1], 1);
    expect((await search(QUERY)).sponsored.map((x) => x.position)).toEqual([1]);
    const simit = await search({ ...QUERY, q: 'simit' });
    expect(simit.data.map((h) => h.title)).toEqual(['Örnek Simit ve Çay Durağı (Demo)']);
    expect(simit.sponsored).toEqual([]);
    await setSlot([3, 13], 2);
    expect((await search({ province: 'istanbul', category: 'restoranlar' })).sponsored).toEqual([]);
    // Listeleme detayı: aynı kategori + il, kendisi hariç (≤ 1).
    const neighbour = await t.prisma.listing.findUniqueOrThrow({ where: { slug: NEIGHBOUR } });
    const box = ListingSponsored.parse(
      (await http().get(`/v1/listings/${neighbour.id}/sponsored`).expect(200)).body,
    );
    expect(box.data).toHaveLength(1);
    const self = await t.prisma.listing.findUniqueOrThrow({ where: { slug: SPONSORED } });
    const own = ListingSponsored.parse(
      (await http().get(`/v1/listings/${self.id}/sponsored`).expect(200)).body,
    );
    expect(own.data).toEqual([]);
  });

  it('[REQ-SPN-009] [REQ-SPN-010] [REQ-SPN-011] [REQ-KVK-013] yalnızca gerçek olaylar sayılır; rapor görüntülenen gösterimi esas alır', async () => {
    const s = (await search()).sponsored[0]!;
    const view = (headers: Record<string, string>, automated = false) =>
      http()
        .post('/v1/sponsored/events')
        .set({ 'X-Forwarded-For': '203.0.113.20', ...headers })
        .send({ token: s.impressionToken, type: 'VIEWED', automated })
        .expect(202);
    expect((await view({ 'User-Agent': BROWSER })).body).toEqual({ accepted: true });
    expect((await view({ 'User-Agent': BROWSER })).body).toEqual({ accepted: false }); // 30 dk
    expect((await view({ 'User-Agent': BROWSER }, true)).body).toEqual({ accepted: false });
    expect((await view({ 'User-Agent': 'Googlebot/2.1' })).body).toEqual({ accepted: false });
    expect((await view({ 'User-Agent': BROWSER, 'Sec-Purpose': 'prefetch' })).body).toEqual({
      accepted: false,
    });
    await http()
      .post('/v1/sponsored/events')
      .send({ token: 'sahte.belirtec', type: 'VIEWED' })
      .expect(202, { accepted: false });

    const ctx = decodeURIComponent(s.clickHref.split('ctx=')[1]!);
    const click = async () =>
      SponsoredClick.parse(
        (
          await http()
            .get(`/v1/sponsored/${s.placementId}/click`)
            .query({ ctx })
            .set({ 'X-Forwarded-For': '203.0.113.20', 'User-Agent': BROWSER })
            .expect(200)
        ).body,
      );
    expect((await click()).path).toBe(`/mekan/${SPONSORED}`);
    await click(); // 30 sn içinde tekrar sayılmaz
    await new Promise((r) => setTimeout(r, 300));

    const report = CampaignReport.parse(
      (await http().get(`/v1/admin/campaigns/${campaign.id}/report`).set(as(sales)).expect(200))
        .body,
    );
    expect(report.totals.viewed).toBe(1);
    expect(report.totals.clicks).toBe(1);
    expect(report.totals.ctr).toBe(1);
    expect(report.totals.served).toBeGreaterThanOrEqual(1);
    expect(report.conversions).toBeNull();
    expect(report.excluded).toBeGreaterThanOrEqual(5);
    expect(report.daily).toHaveLength(1);
    expect(report.bySlot.map((x) => x.surface)).toContain('SEARCH');
    expect(JSON.stringify(report)).not.toMatch(/203\.0\.113|session/i);
    await http().get(`/v1/admin/campaigns/${campaign.id}/report`).set(as(editor)).expect(403);
  });

  it('[REQ-SPN-005] bitişten sonra hiçbir yüzeyde görünmez; duraklatılan kampanya sunulmaz', async () => {
    await transition(sales, 'pause');
    expect((await search()).sponsored).toEqual([]);
    await transition(sales, 'resume');
    expect((await search()).sponsored).toHaveLength(1);
    await t.prisma.campaign.update({
      where: { id: campaign.id },
      data: { endsAt: new Date(Date.now() - 1000) },
    });
    expect((await search()).sponsored).toEqual([]);
    expect((await hub()).sponsored).toEqual([]);
    await t.app.get(CampaignsService).tick();
    const after = await t.prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } });
    expect(after.status).toBe('COMPLETED');
  });

  it('[REQ-GUN-004] sponsor bağlantılı listelemede değerlendirme kaldırma ikinci moderatör onayı ister', async () => {
    const listing = await t.prisma.listing.findUniqueOrThrow({ where: { slug: SPONSORED } });
    const member = await t.prisma.user.create({
      data: {
        email: 'spn-uye@example.com',
        displayName: 'Deneyimli Üye',
        passwordHash: 'kullanilmaz',
        emailVerifiedAt: new Date(),
        ageConfirmedAt: new Date(),
        termsVersion: 'test',
      },
    });
    const review = await t.prisma.review.create({
      data: {
        listingId: listing.id,
        userId: member.id,
        rating: 2,
        body: 'Servis yavaştı ve çay soğuktu; fiyatlar menüdekinden yüksek çıktı, bir daha gitmem.',
        incentivized: false,
        declaredAt: new Date(),
        status: 'PUBLISHED',
        moderationMode: 'POST',
        publishedAt: new Date(),
      },
    });
    const modA = await staffToken(t, 'spn-mod-a@example.com', ['MODERATOR']);
    const modB = await staffToken(t, 'spn-mod-b@example.com', ['MODERATOR']);
    const first = await http()
      .post(`/v1/admin/moderation/reviews/${review.id}/decision`)
      .set(as(modA))
      .send({ action: 'REMOVE', reasonCode: 'ADVERTISING_OR_SPAM', version: review.version })
      .expect(200);
    expect(first.body).toEqual({ ok: true, secondApprovalRequired: true });
    // İçerik ikinci onaya kadar yayında kalır.
    expect((await t.prisma.review.findUniqueOrThrow({ where: { id: review.id } })).status).toBe(
      'PUBLISHED',
    );
    const queue = (
      await http()
        .get('/v1/admin/moderation/queue')
        .query({ queue: 'removals' })
        .set(as(modB))
        .expect(200)
    ).body;
    const item = queue.data.find((x: { review: { id: string } }) => x.review.id === review.id);
    expect(item).toMatchObject({ kind: 'REMOVAL', removal: { reasonCode: 'ADVERTISING_OR_SPAM' } });
    await http()
      .post(`/v1/admin/moderation/removals/${item.id}/decision`)
      .set(as(modA))
      .send({ action: 'CONFIRM' })
      .expect(403);
    await http()
      .post(`/v1/admin/moderation/removals/${item.id}/decision`)
      .set(as(modB))
      .send({ action: 'CONFIRM' })
      .expect(200);
    expect(await t.prisma.review.findUniqueOrThrow({ where: { id: review.id } })).toMatchObject({
      status: 'REMOVED',
      reasonCode: 'ADVERTISING_OR_SPAM',
    });
    const actions = (
      await t.prisma.auditLog.findMany({ where: { targetId: review.id }, select: { action: true } })
    ).map((a) => a.action);
    expect(actions).toEqual(
      expect.arrayContaining([
        'moderation.review.removal_requested',
        'moderation.review.removal_confirmed',
      ]),
    );
  });

  it('[REQ-ARA-009] organik sıralama değişmezliği: kampanyalar aktifken ve silinmişken organik dizi aynı', async () => {
    await t.prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'LIVE', endsAt: new Date(Date.now() + 86_400_000) },
    });
    const withCampaigns = await search();
    const hubWith = await hub();
    expect(withCampaigns.sponsored).toHaveLength(1);
    await t.prisma.creative.deleteMany({});
    await t.prisma.campaignPlacement.deleteMany({});
    await t.prisma.campaign.deleteMany({});
    const without = await search();
    const hubWithout = await hub();
    expect(without.sponsored).toEqual([]);
    expect(without.data).toEqual(withCampaigns.data);
    expect(without.total).toBe(withCampaigns.total);
    expect(hubWithout.listings).toEqual(hubWith.listings);
  });
});
