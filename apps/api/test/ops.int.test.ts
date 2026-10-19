import { readFileSync } from 'node:fs';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AdminOpsSwitches, FEATURE_FLAGS, OpsStatus, Problem } from '@incelemeler/contracts';
import { OutboundService } from '../src/modules/outbound/outbound.service.js';
import { SponsoredServingService } from '../src/modules/sponsorship/sponsored-serving.service.js';
import { SearchIndexerService } from '../src/modules/search/search-indexer.service.js';
import { seedDemoListings } from '../src/seed/demo-listings.js';
import { seedSearchDefaults } from '../src/seed/seed-search.js';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { memberToken, nextIp, STAFF_PASSWORD, staffToken } from './staff.js';

let t: TestContext;
let admin: string;
let moderator: string;
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}`, 'X-Forwarded-For': nextIp() });
const switches = async () =>
  AdminOpsSwitches.parse(
    (await http().get('/v1/admin/ops-switches').set(as(admin)).expect(200)).body,
  );
const put = async (changes: Record<string, unknown>, status = 200) => {
  const s = await switches();
  return http()
    .put('/v1/admin/ops-switches')
    .set(as(admin))
    .send({ version: s.version, reason: 'Acil durum tatbikatı', ...changes })
    .expect(status);
};
const opsStatus = async () =>
  OpsStatus.parse((await http().get('/v1/ops/status').expect(200)).body);

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  await seedSearchDefaults(t.prisma);
  await seedDemoListings(t.prisma);
  await t.app.get(SearchIndexerService).reindexAll();
  admin = await staffToken(t, 'ops-yonetici@example.com', ['ADMIN']);
  moderator = await staffToken(t, 'ops-moderator@example.com', ['MODERATOR']);
}, 120_000);

afterAll(async () => {
  await t?.close();
});

describe('işletim anahtarları ve özellik bayrakları (REQ-OPS-009, REQ-MIM-017)', () => {
  it('[REQ-MIM-017] bayrak kaydındaki her REQ gereksinim listesinde var', () => {
    const reqs = JSON.parse(
      readFileSync(
        new URL('../../../docs/requirements/requirements.json', import.meta.url),
        'utf8',
      ),
    ) as { requirements: Array<{ id: string }> };
    const ids = new Set(reqs.requirements.map((r) => r.id));
    for (const [name, f] of Object.entries(FEATURE_FLAGS)) expect(ids.has(f.req), name).toBe(true);
  });

  it('[REQ-OPS-009] varsayılan açık; değerlendirme ve kayıt anahtarı 503 döndürür; gerekçeli ve denetim kayıtlı; yetki yönetici', async () => {
    expect(await opsStatus()).toEqual({
      maintenance: false,
      reviewsOpen: true,
      registrationOpen: true,
    });
    await http().get('/v1/admin/ops-switches').set(as(moderator)).expect(403);
    await http()
      .put('/v1/admin/ops-switches')
      .set(as(admin))
      .send({ version: 0, reviewsDisabled: true })
      .expect(422);
    await put({ reviewsDisabled: true, registrationDisabled: true });
    expect(await opsStatus()).toMatchObject({ reviewsOpen: false, registrationOpen: false });
    const m = await memberToken(t, 'ops-uye@example.com');
    const listing = await t.prisma.listing.findFirstOrThrow({ where: { status: 'PUBLISHED' } });
    const r = await http().post('/v1/reviews').set(as(m.token)).send({ listingId: listing.id });
    expect(r.status).toBe(503);
    expect(Problem.parse(r.body).code).toBe('SERVICE_UNAVAILABLE');
    const reg = await http().post('/v1/auth/register').set('X-Forwarded-For', nextIp()).send({
      email: 'ops-kayit@example.com',
      password: STAFF_PASSWORD,
      displayName: 'Ops Kayıt',
      ageConfirmed: true,
      termsVersion: '2026-10-taslak',
    });
    expect(reg.status).toBe(503);
    // Sürüm denetimi.
    await http()
      .put('/v1/admin/ops-switches')
      .set(as(admin))
      .send({ version: 0, reason: 'eski sürümle deneme', reviewsDisabled: false })
      .expect(412);
    await put({ reviewsDisabled: false, registrationDisabled: false });
    const audit = await t.prisma.auditLog.findMany({ where: { action: 'ops.switches.updated' } });
    expect(audit).toHaveLength(2);
    expect(audit[0]!.summary).toMatchObject({
      changes: { reviewsDisabled: true, registrationDisabled: true },
      reason: 'Acil durum tatbikatı',
    });
  });

  it('[REQ-OPS-009] tüm sponsorlu yerleşimleri kapat; dış entegrasyonları durdur; bakım modu', async () => {
    const listing = await t.prisma.listing.findUniqueOrThrow({
      where: { slug: 'ornek-gun-isigi-kahvalti-salonu-demo' },
    });
    const org = await t.prisma.organization.create({
      data: { type: 'ADVERTISER', slug: 'ops-reklamveren', name: 'Ops Reklamveren' },
    });
    const slot = await t.prisma.placementSlot.findUniqueOrThrow({ where: { key: 'home-modules' } });
    await t.prisma.campaign.create({
      data: {
        name: 'Ops kampanyası',
        sponsorId: org.id,
        status: 'LIVE',
        startsAt: new Date(Date.now() - 60_000),
        endsAt: new Date(Date.now() + 86_400_000),
        placements: { create: { slotId: slot.id, listingId: listing.id } },
      },
    });
    const serving = t.app.get(SponsoredServingService);
    expect(await serving.forHome(null, 2)).toHaveLength(1);
    await put({ sponsoredDisabled: true, integrationsDisabled: true });
    expect(await serving.forHome(null, 2)).toEqual([]);
    expect(await t.app.get(OutboundService).checkDue()).toBe(0);
    await put({ sponsoredDisabled: false, integrationsDisabled: false });
    expect(await serving.forHome(null, 2)).toHaveLength(1);

    await put({ maintenanceMode: true });
    expect(await opsStatus()).toEqual({
      maintenance: true,
      reviewsOpen: false,
      registrationOpen: false,
    });
    await put({ maintenanceMode: false });
  });
});
