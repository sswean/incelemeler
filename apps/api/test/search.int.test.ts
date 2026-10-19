import { readFileSync } from 'node:fs';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Problem, SearchResponse, SuggestResponse } from '@incelemeler/contracts';
import { normalizeTr } from '@incelemeler/utils';
import { OutboxService } from '../src/modules/outbox/outbox.service.js';
import { SEARCH_PORT, type SearchPort } from '../src/modules/search/search.port.js';
import { SearchIndexerService } from '../src/modules/search/search-indexer.service.js';
import { seedDemoListings } from '../src/seed/demo-listings.js';
import { seedSearchDefaults } from '../src/seed/seed-search.js';
import { seedTaxonomy } from '../src/seed/seed-taxonomy.js';
import { startTestApp, type TestContext } from './app.js';
import { staffToken } from './staff.js';

let t: TestContext;
const http = () => request(t.app.getHttpServer());
const search = async (query: Record<string, string | string[]>) =>
  SearchResponse.parse((await http().get('/v1/search').query(query).expect(200)).body);
const slugOf = (path: string) => path.split('/').at(-1)!;

interface CorpusEntry {
  q: string;
  expect?: string[];
  expectZero?: boolean;
  note?: string;
}

beforeAll(async () => {
  t = await startTestApp();
  await seedTaxonomy(t.prisma);
  await seedSearchDefaults(t.prisma);
  await seedDemoListings(t.prisma);
  await t.app.get(SearchIndexerService).reindexAll();
}, 120_000);

afterAll(async () => {
  await t?.close();
});

describe('Türkçe normalizasyon paritesi (REQ-ARA-003)', () => {
  it('[REQ-ARA-003] SQL normalize_tr/fold_tr ile @incelemeler/utils normalizeTr birebir aynı', async () => {
    const samples = [
      "İSTANBUL'DA iyi kahvaltı",
      'Istanbul',
      'ıstanbul',
      'IĞDIR’ın  Çeşme‘si',
      'Antalya`da — denize sıfır!',
      'Café Ağaç Üşü Şiş Göl',
      "Muğla'nın 2. koyu",
      'Kapadokya (Göreme) / Ürgüp',
      'ÂLÂ  hâlâ  Îmâ',
      'kablosuz-kulaklık_K2',
      '   ',
    ];
    for (const s of samples) {
      const [row] = await t.prisma.$queryRaw<Array<{ n: string; f: string }>>`
        SELECT normalize_tr(${s}) AS n, fold_tr(${s}) AS f`;
      const app = normalizeTr(s);
      expect({ s, n: row!.n, f: row!.f }).toEqual({ s, n: app.tr, f: app.folded });
    }
  });
});

describe('arama (REQ-ARA-001…013)', () => {
  it('[REQ-ARA-006] sorgu korpusu: recall@5 ≥ %90; sıfır sonuç yalnızca beklenen sorgularda', async () => {
    const corpus = JSON.parse(
      readFileSync(
        new URL('../../../docs/requirements/ARA-sorgu-korpusu.json', import.meta.url),
        'utf8',
      ),
    ) as { queries: CorpusEntry[] };
    expect(corpus.queries.length).toBeGreaterThanOrEqual(50);
    const misses: string[] = [];
    const unexpectedZero: string[] = [];
    let recallSum = 0;
    let scored = 0;
    for (const entry of corpus.queries) {
      const res = await search({ q: entry.q });
      if (entry.expectZero) {
        if (res.total !== 0) misses.push(`${entry.q}: sıfır beklenirken ${res.total}`);
        continue;
      }
      if (res.total === 0) unexpectedZero.push(entry.q);
      const top = res.data.slice(0, 5).map((h) => slugOf(h.path));
      const expected = entry.expect ?? [];
      const found = expected.filter((s) => top.includes(s)).length;
      const recall = found / Math.min(expected.length, 5);
      recallSum += recall;
      scored++;
      if (recall < 1) misses.push(`${entry.q}: ${found}/${expected.length} → [${top.join(', ')}]`);
    }
    const recallAt5 = recallSum / scored;
    // Ayrıntılı rapor (eşik altında hangi sorguların kaçtığı) — test çıktısında görünür.
    if (misses.length) console.warn(`[korpus] kaçanlar:\n${misses.join('\n')}`);
    console.warn(`[korpus] recall@5 = ${recallAt5.toFixed(3)} (${scored} sorgu)`);
    expect(unexpectedZero).toEqual([]);
    expect(recallAt5).toBeGreaterThanOrEqual(0.9);
  });

  it('[REQ-ARA-007] [REQ-ARA-012] ayrıştırılan filtreler çip olarak döner; ayrıştırma kapatılabilir', async () => {
    const res = await search({ q: "Antalya'da denize yakın uygun fiyatlı oteller" });
    expect(res.interpretation).toMatchObject({
      place: { name: 'Antalya', level: 'PROVINCE', province: 'antalya', corrected: false },
      category: { slug: 'oteller' },
      text: null,
    });
    expect(res.interpretation.intents.map((i) => i.key)).toEqual(['denize-yakin', 'uygun-fiyat']);
    for (const h of res.data) {
      expect(h.priceLevel).toBeLessThanOrEqual(2);
      expect(h.type).toBe('LISTING');
    }
    // Kullanıcı çipleri kaldırınca açık parametrelerle ve ayrıştırmasız arar.
    const raw = await search({ q: 'oteller', interpret: 'false', province: 'antalya' });
    expect(raw.interpretation.category).toBeNull();
    expect(raw.total).toBeGreaterThan(res.total);
  });

  it('[REQ-ARA-005] yazım hatasında "Bunu mu demek istediniz?" önerisi', async () => {
    const res = await search({ q: 'kapadoyka balon' });
    expect(res.interpretation.place).toMatchObject({ name: 'Nevşehir', corrected: true });
    expect(res.interpretation.didYouMean).toBe('kapadokya balon');
    const typo = await search({ q: 'baklva' });
    expect(typo.fuzzyFallback).toBe(true);
    expect(slugOf(typo.data[0]!.path)).toBe('ornek-baklava-atolyesi-karakoy-demo');
  });

  it('[REQ-ARA-007] açık filtreler: il/ilçe, kategori (alt kategoriler dahil), tür, fiyat, özellik', async () => {
    const kadikoy = await search({ province: 'istanbul', district: 'kadikoy' });
    expect(kadikoy.total).toBe(3);
    const yemeIcme = await search({ category: 'yeme-icme', province: 'izmir' });
    expect(yemeIcme.data.every((h) => h.kind === 'PLACE')).toBe(true);
    expect(yemeIcme.total).toBe(5);
    const products = await search({ kind: 'PRODUCT', attr: 'wireless:true', priceMax: '2' });
    expect(products.data.map((h) => slugOf(h.path)).sort()).toEqual([
      'ornek-kablosuz-kulaklik-k1-demo',
      'ornek-spor-kulaklik-kosu-r2-demo',
    ]);
    // Değerlendirme yokken puan filtresi sonuç üretmez (sahte puan yok — AK-02).
    expect((await search({ province: 'istanbul', minRating: '4' })).total).toBe(0);
  });

  it('[REQ-ARA-008] sıralama: en yakın konum ister; en yakın mesafeye göre; sıralama deterministik', async () => {
    const problem = Problem.parse(
      (await http().get('/v1/search').query({ q: 'otel', sort: 'nearest' }).expect(422)).body,
    );
    expect(problem.errors?.[0]?.pointer).toBe('/query/sort');
    // Göreme'ye yakın nokta.
    const near = await search({
      category: 'konaklama',
      sort: 'nearest',
      lat: '38.64',
      lng: '34.83',
    });
    expect(slugOf(near.data[0]!.path)).toBe('ornek-goreme-tas-ev-pansiyonu-demo');
    expect(near.data[0]!.distanceKm).toBeLessThan(1);
    const a = await search({ q: 'kahvaltı' });
    const b = await search({ q: 'kahvaltı' });
    expect(a.data.map((h) => h.id)).toEqual(b.data.map((h) => h.id));
  });

  it('[REQ-ARA-013] sıfır sonuçta gevşetme önerileri (filtre ve sonuç sayısı)', async () => {
    const res = await search({ q: 'trabzon kahvaltı' });
    expect(res.total).toBe(0);
    expect(res.relaxations).toEqual([
      expect.objectContaining({ drop: 'place', label: 'Trabzon', count: 8 }),
    ]);
  });

  it('[REQ-MIM-009] bilinmeyen parametre 400; filtrelenemeyen özellik ve bilinmeyen yer 422', async () => {
    await http().get('/v1/search').query({ q: 'otel', sponsor: '1' }).expect(400);
    await http().get('/v1/search').query({ attr: 'gizli:true' }).expect(422);
    await http().get('/v1/search').query({ province: 'atlantis' }).expect(422);
    await http().get('/v1/search').query({ district: 'kadikoy' }).expect(422);
  });

  it('[REQ-ARA-010] otomatik tamamlama: yer, kategori, listeleme gruplu; ek/aksan toleranslı', async () => {
    const s = SuggestResponse.parse(
      (await http().get('/v1/search/suggest').query({ q: 'kahval' }).expect(200)).body,
    );
    expect(s.categories.map((c) => c.title)).toContain('Kahvaltı Mekanları');
    expect(s.listings.length).toBeGreaterThan(0);
    expect(s.listings.length).toBeLessThanOrEqual(5);
    const place = SuggestResponse.parse(
      (await http().get('/v1/search/suggest').query({ q: 'USKUD' }).expect(200)).body,
    );
    expect(place.places[0]).toMatchObject({
      title: 'Üsküdar',
      subtitle: 'İstanbul',
      path: '/ara?il=istanbul&ilce=uskudar',
    });
  });

  it('[REQ-ARA-014] arama olayı kişisel veri ve oturum karması olmadan kaydedilir', async () => {
    await search({ q: 'İzmir kumru' });
    const ev = await t.prisma.searchEvent.findFirst({
      where: { queryNorm: 'izmir kumru' },
      orderBy: { id: 'desc' },
    });
    expect(ev).toMatchObject({ resultCount: 1, sessionHash: null });
  });
});

describe('indeksleme (REQ-ARA-002)', () => {
  it('[REQ-ARA-002] listeleme yayımı/arşivi outbox ile okuma modeline yansır', async () => {
    const token = await staffToken(t, 'arama-editor@example.com', ['EDITOR']);
    const cat = await t.prisma.category.findUniqueOrThrow({ where: { slug: 'kafeler' } });
    const created = await http()
      .post('/v1/admin/listings')
      .set({ Authorization: `Bearer ${token}` })
      .send({
        kind: 'PLACE',
        name: 'Zeytin Dalı Kahvecisi',
        primaryCategoryId: cat.id,
        source: 'Editör ziyareti',
      })
      .expect(201);
    const id = created.body.id as string;
    const outbox = t.app.get(OutboxService);
    await outbox.runOnce();
    const titles = async () => (await search({ q: 'zeytin dalı' })).data.map((h) => h.title);
    expect(await titles()).not.toContain('Zeytin Dalı Kahvecisi'); // taslak aranmaz
    await t.prisma.listing.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
    await t.app.get(SearchIndexerService).indexListing(id);
    expect((await titles())[0]).toBe('Zeytin Dalı Kahvecisi');
    await t.prisma.listing.update({ where: { id }, data: { status: 'ARCHIVED' } });
    await t.prisma.outboxEvent.create({
      data: { type: 'catalog.listing.status_changed', aggregateType: 'listing', aggregateId: id },
    });
    await outbox.runOnce();
    expect(await titles()).not.toContain('Zeytin Dalı Kahvecisi');
  });

  it('[REQ-ARA-001] [REQ-ARA-002] arama portu doğrudan kullanılabilir; üretim ölçütünde DEMO belgeler dışlanır (AK-03)', async () => {
    const port = t.app.get<SearchPort>(SEARCH_PORT);
    const base = {
      tokens: ['kahvalti'],
      docTypes: ['LISTING' as const],
      kind: null,
      categoryId: null,
      provinceId: null,
      districtId: null,
      priceMax: null,
      minRating: null,
      attributes: {},
      sort: 'recommended' as const,
      near: null,
      offset: 0,
      limit: 50,
      fuzzy: false,
      matchAny: false,
    };
    expect((await port.query({ ...base, excludeDemo: false })).total).toBeGreaterThan(0);
    expect((await port.query({ ...base, excludeDemo: true })).total).toBe(0);
  });
});
