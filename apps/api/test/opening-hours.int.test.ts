import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { OpeningHours, Problem, PublicListing, SearchResponse } from '@incelemeler/contracts';
import { isOpenAt } from '@incelemeler/utils';
import { openListingsSql } from '../src/modules/search/postgres-search.adapter.js';
import { SearchIndexerService } from '../src/modules/search/search-indexer.service.js';
import { seedDemoListings } from '../src/seed/demo-listings.js';
import { seedSearchDefaults } from '../src/seed/seed-search.js';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { nextIp, staffToken } from './staff.js';

let t: TestContext;
let editor: string;
let author: string;
let bar: { id: string; slug: string };
let allDay: { id: string; slug: string };
const http = () => request(t.app.getHttpServer());
const as = (token: string) => ({ Authorization: `Bearer ${token}`, 'X-Forwarded-For': nextIp() });
const at = (local: string) => new Date(`${local}:00+03:00`);
const BAR = {
  timezone: 'Europe/Istanbul',
  weekly: [
    ...[1, 2, 3, 4, 5].map((day) => ({ day, opens: '18:00', closes: '02:00' })),
    { day: 6, opens: '18:00', closes: '04:00' },
  ],
  exceptions: [
    { date: '2026-10-29', closed: true, note: 'Cumhuriyet Bayramı' },
    { date: '2026-10-30', closed: false, opens: '20:00', closes: '23:00' },
  ],
  verified: true,
};
const put = (id: string, body: Record<string, unknown>, token = editor) =>
  http().put(`/v1/admin/listings/${id}/opening-hours`).set(as(token)).send(body);

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  await seedSearchDefaults(t.prisma);
  await seedDemoListings(t.prisma);
  await t.app.get(SearchIndexerService).reindexAll();
  const places = await t.prisma.listing.findMany({
    where: { status: 'PUBLISHED', kind: 'PLACE' },
    orderBy: { slug: 'asc' },
    take: 2,
  });
  bar = places[0]!;
  allDay = places[1]!;
  editor = await staffToken(t, 'saat-editor@example.com', ['EDITOR']);
  author = await staffToken(t, 'saat-yazar@example.com', ['AUTHOR']);
}, 120_000);

afterAll(async () => {
  await t?.close();
});

describe('çalışma saatleri (REQ-VER-010)', () => {
  it('[REQ-VER-010] panel: gece yarısını aşan aralık ve bayram istisnası kaydedilir; geçersiz girişler reddedilir; yetki', async () => {
    const saved = OpeningHours.parse((await put(bar.id, BAR).expect(200)).body);
    expect(saved.weekly[0]).toEqual({ day: 1, opens: '18:00', closes: '02:00' });
    expect(saved.exceptions.map((e) => e.date)).toEqual(['2026-10-29', '2026-10-30']);
    expect(saved.verifiedAt).not.toBeNull();
    await put(bar.id, { ...BAR, weekly: [{ day: 1, opens: '10:00', closes: '10:00' }] }).expect(
      422,
    );
    await put(bar.id, { ...BAR, weekly: [{ day: 8, opens: '10:00', closes: '12:00' }] }).expect(
      422,
    );
    await put(bar.id, {
      ...BAR,
      exceptions: [{ date: '2026-10-29', closed: true, opens: '10:00', closes: '12:00' }],
    }).expect(422);
    await put(bar.id, { ...BAR, exceptions: [BAR.exceptions[0], BAR.exceptions[0]] }).expect(422);
    expect(
      Problem.parse((await put(bar.id, { ...BAR, timezone: 'Mars/Olympus' }).expect(422)).body)
        .errors?.[0]?.code,
    ).toBe('invalid_timezone');
    await put(bar.id, BAR, author).expect(403);
    await put(allDay.id, {
      weekly: [1, 2, 3, 4, 5, 6, 7].map((day) => ({ day, opens: '00:00', closes: '24:00' })),
      exceptions: [],
    }).expect(200);
    expect(
      await t.prisma.auditLog.count({ where: { action: 'catalog.listing.hours_updated' } }),
    ).toBe(2);
  });

  it('[REQ-VER-010] [REQ-TST-004] "şu an açık" SQL filtresi saf hesapla aynı sonucu verir (gece yarısı, bayram, özel saat)', async () => {
    const weekly = BAR.weekly.map((w) => ({
      day: w.day,
      opens: Number(w.opens.slice(0, 2)) * 60,
      closes: Number(w.closes.slice(0, 2)) * 60,
    }));
    const ex = [
      { date: '2026-10-29', closed: true },
      { date: '2026-10-30', closed: false, opens: 1200, closes: 1380 },
    ];
    for (const local of [
      '2026-10-19T17:59',
      '2026-10-19T18:00',
      '2026-10-20T01:00',
      '2026-10-20T02:00',
      '2026-10-25T03:00',
      '2026-10-25T20:00',
      '2026-10-26T01:00',
      '2026-10-29T01:00',
      '2026-10-29T19:00',
      '2026-10-30T01:00',
      '2026-10-30T21:00',
      '2026-10-30T23:30',
    ]) {
      const ids = (await t.prisma.$queryRaw<Array<{ id: string }>>(openListingsSql(at(local)))).map(
        (r) => r.id,
      );
      expect(ids.includes(bar.id), local).toBe(isOpenAt(weekly, ex, 'Europe/Istanbul', at(local)));
      expect(ids.includes(allDay.id), local).toBe(true);
    }
  });

  it('[REQ-VER-010] herkese açık detayda saatler ve sunucuda hesaplanan durum; aramada "Şu an açık" saat girilmemişleri dışarıda bırakır', async () => {
    const l = PublicListing.parse(
      (await http().get(`/v1/listings/${allDay.slug}`).expect(200)).body,
    );
    expect(l.openingHours).toMatchObject({ openNow: true, timezone: 'Europe/Istanbul' });
    const none = await t.prisma.listing.findFirstOrThrow({
      where: { status: 'PUBLISHED', id: { notIn: [bar.id, allDay.id] } },
    });
    expect(
      PublicListing.parse((await http().get(`/v1/listings/${none.slug}`).expect(200)).body)
        .openingHours,
    ).toBeNull();
    const res = SearchResponse.parse(
      (
        await http()
          .get('/v1/search')
          .query({ openNow: 'true', type: 'LISTING' })
          .set('X-Forwarded-For', nextIp())
          .expect(200)
      ).body,
    );
    const ids = res.data.map((d) => d.id);
    expect(ids).toContain(allDay.id);
    expect(ids).not.toContain(none.id);
  });
});
