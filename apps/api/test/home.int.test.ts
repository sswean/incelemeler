import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AdminHomeModuleList, HomeResponse, Problem } from '@incelemeler/contracts';
import { SearchIndexerService } from '../src/modules/search/search-indexer.service.js';
import { seedDemoListings } from '../src/seed/demo-listings.js';
import { seedSearchDefaults } from '../src/seed/seed-search.js';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { nextIp, staffToken } from './staff.js';

let t: TestContext;
let editor: string;
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}`, 'X-Forwarded-For': nextIp() });
const home = async (il?: string) =>
  HomeResponse.parse(
    (
      await http()
        .get('/v1/home')
        .query(il ? { il } : {})
        .expect(200)
    ).body,
  );
const modules = async () =>
  AdminHomeModuleList.parse(
    (await http().get('/v1/admin/home-modules').set(as(editor)).expect(200)).body,
  ).data;
const patch = async (key: string, body: Record<string, unknown>, status = 200) => {
  const m = (await modules()).find((x) => x.key === key)!;
  return http()
    .patch(`/v1/admin/home-modules/${m.id}`)
    .set(as(editor))
    .send({ version: m.version, ...body })
    .expect(status);
};

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  await seedSearchDefaults(t.prisma);
  await seedDemoListings(t.prisma);
  await t.app.get(SearchIndexerService).reindexAll();
  editor = await staffToken(t, 'anasayfa-editor@example.com', ['EDITOR']);
}, 120_000);

afterAll(async () => {
  await t?.close();
});

describe('ana sayfa modülleri (REQ-ADM-006, A15.4)', () => {
  it('[REQ-ADM-006] varsayılan sıra; öğesi minOge altındaki modül gizlenir; il bağlamı', async () => {
    const h = await home();
    const keys = h.modules.map((m) => m.key);
    expect(keys[0]).toBe('kategori-kisayollari');
    expect(keys).toContain('sehrini-sec');
    expect(keys).toContain('sehirde-populer-yeme-icme');
    expect(keys).toContain('guven-ve-seffaflik');
    // İçerik yok (yeni rehber, karşılaştırma) ve editör seçimi boş → gizli; sponsorlu kampanya yok → gizli.
    for (const hidden of [
      'yeni-rehberler',
      'karsilastirmalar',
      'editorun-sectikleri',
      'sponsorlu',
    ]) {
      expect(keys).not.toContain(hidden);
    }
    expect(h.modules.flatMap((m) => m.cards).every((c) => c.commercial.type === 'NONE')).toBe(true);

    const izmir = await home('izmir');
    expect(izmir.province).toEqual({ slug: 'izmir', name: 'İzmir' });
    const food = izmir.modules.find((m) => m.key === 'sehirde-populer-yeme-icme');
    // İzmir'de yeterli yeme-içme listelemesi yoksa modül gizlenir; varsa kartlar İzmir'dendir.
    for (const c of food?.cards ?? []) expect(c.subtitle).toContain('İzmir');
    await http().get('/v1/home').query({ il: 'Izmir!' }).expect(422);
  });

  it('[REQ-ADM-006] editörün seçtikleri ve görünürlük penceresi panelden; denetim kaydı', async () => {
    const picks = [
      'ornek-moda-ocakbasi-demo',
      'ornek-uskudar-borekcisi-demo',
      'ornek-kadikoy-kahve-duragi-demo',
      'ornek-baklava-atolyesi-karakoy-demo',
    ];
    await patch('editorun-sectikleri', { config: { listingSlugs: picks, articleSlugs: [] } });
    const h = await home();
    const ed = h.modules.find((m) => m.key === 'editorun-sectikleri')!;
    expect(ed.cards.map((c) => c.path)).toEqual(picks.map((s) => `/mekan/${s}`));
    expect(ed.cards.every((c) => c.commercial.type === 'NONE')).toBe(true);

    await patch('sehirde-populer-yeme-icme', {
      visibleUntil: new Date(Date.now() - 60_000).toISOString(),
      visibleFrom: new Date(Date.now() - 3_600_000).toISOString(),
    });
    expect((await home()).modules.map((m) => m.key)).not.toContain('sehirde-populer-yeme-icme');
    await patch('sehirde-populer-yeme-icme', { visibleFrom: null, visibleUntil: null });
    expect(await t.prisma.auditLog.count({ where: { action: 'home.module.updated' } })).toBe(3);
  });

  it('[REQ-SPN-004] sponsorlu sınırı aşan yapılandırma kaydedilmez (ilk ekranda değil, ≤ 2 kart)', async () => {
    const pos = Problem.parse((await patch('sponsorlu', { position: 5 }, 422)).body);
    expect(pos.errors?.map((e) => e.code)).toContain('home_sponsored_position');
    const cards = Problem.parse((await patch('sponsorlu', { maxItems: 3 }, 422)).body);
    expect(cards.errors?.map((e) => e.code)).toContain('home_sponsored_cards');
    // Veritabanı da sponsorlu kaynağı yalnızca sponsorlu modülde kabul eder.
    await expect(
      t.prisma.homeModule.updateMany({
        where: { key: 'editorun-sectikleri' },
        data: { source: 'SPONSORED' },
      }),
    ).rejects.toThrow();
  });

  it('[REQ-SPN-003] [REQ-SPN-004] sponsorlu modül etiketli; kartların ≤ %20si', async () => {
    const listing = await t.prisma.listing.findUniqueOrThrow({
      where: { slug: 'ornek-gun-isigi-kahvalti-salonu-demo' },
    });
    const org = await t.prisma.organization.create({
      data: { type: 'ADVERTISER', slug: 'ornek-reklamveren', name: 'Örnek Reklamveren' },
    });
    const slot = await t.prisma.placementSlot.findUniqueOrThrow({ where: { key: 'home-modules' } });
    await t.prisma.campaign.create({
      data: {
        name: 'Ana sayfa denemesi',
        sponsorId: org.id,
        status: 'LIVE',
        startsAt: new Date(Date.now() - 60_000),
        endsAt: new Date(Date.now() + 86_400_000),
        placements: { create: { slotId: slot.id, listingId: listing.id } },
      },
    });
    const h = await home();
    const sp = h.modules.find((m) => m.type === 'SPONSORED')!;
    expect(sp.cards).toHaveLength(1);
    expect(sp.cards[0]!.commercial).toMatchObject({ type: 'SPONSORED', label: 'Sponsorlu' });
    expect(sp.cards[0]!.sponsored?.clickHref).toMatch(/^\/git\/s\//);
    const index = h.modules.findIndex((m) => m.type === 'SPONSORED');
    expect(index).toBeGreaterThanOrEqual(3);
    const all = h.modules.flatMap((m) => m.cards);
    const sponsored = all.filter((c) => c.commercial.type !== 'NONE').length;
    expect(sponsored / all.length).toBeLessThanOrEqual(0.2);
    // Editörün seçtikleri sponsorlu kart içermez.
    const ed = h.modules.find((m) => m.key === 'editorun-sectikleri')!;
    expect(ed.cards.some((c) => c.sponsored !== null)).toBe(false);
  });
});
