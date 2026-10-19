import type { ListingKind } from '@incelemeler/contracts';
import { slugifyTr } from '@incelemeler/utils';
import type { Prisma, PrismaClient } from '../generated/prisma/client.js';

/**
 * Kurgusal demo listelemeler (§12.4, AK-03): tamamı "Örnek … (Demo)" adlı, dataOrigin=DEMO; gerçek bir
 * işletmeyi temsil etmez; görsel, puan, değerlendirme, fiyat ya da lisans numarası içermez.
 * Arama sorgu korpusunun (docs/requirements/ARA-sorgu-korpusu.json) beklenen sonuçları bu veridir.
 * Koordinatlar ilçe merkezlerine yakın yaklaşık noktalardır.
 */
export interface DemoListing {
  name: string;
  kind: ListingKind;
  category: string;
  province: string;
  district: string | null;
  priceLevel: number | null;
  attributes?: Record<string, unknown>;
  short: string;
  lat?: number;
  lng?: number;
  product?: { brand: string; model: string };
}

const D = (
  name: string,
  kind: ListingKind,
  category: string,
  where: [string, string | null, number?, number?],
  priceLevel: number | null,
  short: string,
  attributes: Record<string, unknown> = {},
  product?: { brand: string; model: string },
): DemoListing => ({
  name: `Örnek ${name} (Demo)`,
  kind,
  category,
  province: where[0],
  district: where[1],
  lat: where[2],
  lng: where[3],
  priceLevel,
  short,
  attributes,
  product,
});

export const DEMO_LISTINGS: DemoListing[] = [
  // İstanbul — yeme-içme
  D(
    'Kahvaltı Evi Cihangir',
    'PLACE',
    'kahvalti-mekanlari',
    ['istanbul', 'beyoglu', 41.0315, 28.9833],
    2,
    'Serpme kahvaltı ve ev reçelleri.',
    { familyFriendly: true },
  ),
  D(
    'Köy Kahvaltısı Kadıköy',
    'PLACE',
    'kahvalti-mekanlari',
    ['istanbul', 'kadikoy', 40.9903, 29.0275],
    2,
    'Moda sahiline yakın köy kahvaltısı.',
  ),
  D(
    'Boğaz Kahvaltı Bahçesi',
    'PLACE',
    'kahvalti-mekanlari',
    ['istanbul', 'sariyer', 41.1666, 29.05],
    3,
    'Bahçede hafta sonu kahvaltısı.',
    { familyFriendly: true },
  ),
  D(
    'Simit ve Çay Durağı',
    'PLACE',
    'kahvalti-mekanlari',
    ['istanbul', 'uskudar', 41.0255, 29.0153],
    1,
    'Sabah simidi, demli çay.',
  ),
  D(
    'Gün Işığı Kahvaltı Salonu',
    'PLACE',
    'kahvalti-mekanlari',
    ['istanbul', 'besiktas', 41.0428, 29.0075],
    2,
    'Menemen ve gözleme.',
  ),
  D(
    'Teras Restoran Galata',
    'PLACE',
    'fine-dining',
    ['istanbul', 'beyoglu', 41.0256, 28.9741],
    4,
    'Manzaralı akşam yemeği, özel gün menüsü.',
    { specialOccasion: true },
  ),
  D(
    'Balıkçı Lokantası Kumkapı',
    'PLACE',
    'restoranlar',
    ['istanbul', 'fatih', 41.0045, 28.9666],
    3,
    'Mevsim balığı ve meze.',
    { specialOccasion: true },
  ),
  D(
    'Köfte Salonu Fatih',
    'PLACE',
    'yerel-mutfaklar',
    ['istanbul', 'fatih', 41.0082, 28.9784],
    1,
    'Izgara köfte ve piyaz.',
    { familyFriendly: true },
  ),
  D(
    'Moda Ocakbaşı',
    'PLACE',
    'restoranlar',
    ['istanbul', 'kadikoy', 40.9839, 29.0257],
    2,
    'Ocakbaşı kebap ve salata.',
  ),
  D(
    'Nişantaşı Bistro',
    'PLACE',
    'restoranlar',
    ['istanbul', 'sisli', 41.0513, 28.9937],
    3,
    'Akdeniz mutfağı, romantik akşam.',
    { specialOccasion: true },
  ),
  D(
    'Kadıköy Kahve Durağı',
    'PLACE',
    'kafeler',
    ['istanbul', 'kadikoy', 40.9905, 29.0244],
    2,
    'Üçüncü dalga kahve ve tatlı.',
  ),
  D(
    'Üsküdar Börekçisi',
    'PLACE',
    'sokak-lezzetleri',
    ['istanbul', 'uskudar', 41.0232, 29.0151],
    1,
    'Su böreği ve ayran.',
  ),
  D(
    'Baklava Atölyesi Karaköy',
    'PLACE',
    'tatlicilar-ve-pastaneler',
    ['istanbul', 'beyoglu', 41.0225, 28.9768],
    2,
    'Fıstıklı baklava ve kaymak.',
  ),
  // İzmir
  D(
    'Kordon Kahvaltıcısı',
    'PLACE',
    'kahvalti-mekanlari',
    ['izmir', 'konak', 38.4237, 27.1311],
    2,
    'Boyoz ve gevrekli İzmir kahvaltısı.',
  ),
  D(
    'Alaçatı Kahvaltı Konağı',
    'PLACE',
    'kahvalti-mekanlari',
    ['izmir', 'cesme', 38.2826, 26.3747],
    3,
    'Taş konakta otlu kahvaltı.',
    { familyFriendly: true },
  ),
  D(
    'Urla Bağ Evi Restoran',
    'PLACE',
    'fine-dining',
    ['izmir', 'urla', 38.3226, 26.7647],
    4,
    'Bağ içinde tadım menüsü.',
    { specialOccasion: true },
  ),
  D(
    'Karşıyaka Balık Evi',
    'PLACE',
    'restoranlar',
    ['izmir', 'karsiyaka', 38.4555, 27.1093],
    2,
    'Deniz ürünleri.',
  ),
  D(
    'Konak Kumru Büfesi',
    'PLACE',
    'sokak-lezzetleri',
    ['izmir', 'konak', 38.4192, 27.1287],
    1,
    'Kumru ve şambali.',
  ),
  D(
    'Çeşme Araç Kiralama',
    'SERVICE_PROVIDER',
    'arac-kiralama',
    ['izmir', 'cesme', 38.3236, 26.3027],
    2,
    'Günlük ve haftalık araç kiralama.',
  ),
  D(
    'Ege Oto Kiralama Havalimanı',
    'SERVICE_PROVIDER',
    'arac-kiralama',
    ['izmir', 'gaziemir', 38.2924, 27.1567],
    2,
    'Havalimanı teslimli günlük kiralama.',
  ),
  D(
    'Bornova Rent Araç',
    'SERVICE_PROVIDER',
    'arac-kiralama',
    ['izmir', 'bornova', 38.4697, 27.2211],
    1,
    'Ekonomik sınıf araçlar.',
  ),
  D(
    'Alaçatı Butik Otel',
    'LODGING',
    'butik-oteller',
    ['izmir', 'cesme', 38.2827, 26.3765],
    3,
    'Taş evde butik konaklama.',
  ),
  D(
    'Foça Deniz Pansiyonu',
    'LODGING',
    'pansiyonlar',
    ['izmir', 'foca', 38.6704, 26.7576],
    2,
    'Denize sıfır aile pansiyonu.',
    { beachfront: true, familyFriendly: true },
  ),
  D(
    'Selçuk Antik Kent Gezisi',
    'EXPERIENCE',
    'muze-ve-kultur-turlari',
    ['izmir', 'selcuk', 37.9396, 27.3417],
    2,
    'Rehberli antik kent turu.',
    { guided: true },
  ),
  // Antalya
  D(
    'Konyaaltı Sahil Oteli',
    'LODGING',
    'oteller',
    ['antalya', 'konyaalti', 36.8686, 30.6337],
    2,
    'Denize sıfır uygun fiyatlı otel.',
    { beachfront: true, familyFriendly: true },
  ),
  D(
    'Lara Aile Tatil Köyü',
    'LODGING',
    'tatil-koyleri',
    ['antalya', 'muratpasa', 36.8516, 30.7857],
    4,
    'Çocuk kulüplü her şey dahil tatil köyü.',
    { beachfront: true, familyFriendly: true },
  ),
  D(
    'Kaleiçi Taş Konak Otel',
    'LODGING',
    'butik-oteller',
    ['antalya', 'muratpasa', 36.8841, 30.7056],
    3,
    'Tarihi Kaleiçi’nde butik otel.',
  ),
  D(
    'Kemer Koy Oteli',
    'LODGING',
    'oteller',
    ['antalya', 'kemer', 36.6026, 30.5597],
    2,
    'Plaja yürüme mesafesinde ekonomik otel.',
    { beachfront: true },
  ),
  D(
    'Side Antik Liman Oteli',
    'LODGING',
    'oteller',
    ['antalya', 'manavgat', 36.7676, 31.3899],
    3,
    'Antik kente yakın otel.',
    { beachfront: true },
  ),
  D(
    'Alanya Kale Pansiyon',
    'LODGING',
    'pansiyonlar',
    ['antalya', 'alanya', 36.5438, 31.9998],
    1,
    'Kaleye yakın sade pansiyon.',
  ),
  D(
    'Kaş Dalış Merkezi Pansiyonu',
    'LODGING',
    'pansiyonlar',
    ['antalya', 'kas', 36.2018, 29.6377],
    2,
    'Dalış turlarına yakın pansiyon.',
    { beachfront: true },
  ),
  D(
    'Turkuaz Koy Kaş',
    'POI',
    'plajlar',
    ['antalya', 'kas', 36.229, 29.449],
    null,
    'Turkuaz koy ve çakıl plaj.',
    { familyFriendly: true },
  ),
  D(
    'Şelale Parkı Antalya',
    'POI',
    'dogal-guzellikler',
    ['antalya', 'muratpasa', 36.858, 30.783],
    null,
    'Şelale ve yürüyüş alanı.',
    { familyFriendly: true },
  ),
  D(
    'Kanyon Rafting Manavgat',
    'EXPERIENCE',
    'macera-ve-spor-aktiviteleri',
    ['antalya', 'manavgat', 37.1866, 31.1847],
    2,
    'Rehberli rafting turu.',
    { guided: true },
  ),
  D(
    'Kemer Tekne Turu',
    'EXPERIENCE',
    'tekne-turlari',
    ['antalya', 'kemer', 36.598, 30.561],
    2,
    'Koylarda günübirlik tekne turu.',
    { familyFriendly: true },
  ),
  D(
    'Antalya Havalimanı Araç Kiralama',
    'SERVICE_PROVIDER',
    'arac-kiralama',
    ['antalya', 'muratpasa', 36.9, 30.8],
    2,
    'Havalimanından günlük kiralama.',
  ),
  D(
    'Muratpaşa Kahvaltı Bahçesi',
    'PLACE',
    'kahvalti-mekanlari',
    ['antalya', 'muratpasa', 36.8879, 30.7097],
    2,
    'Portakal bahçesinde kahvaltı.',
  ),
  // Muğla
  D(
    'Bodrum Koy Oteli',
    'LODGING',
    'oteller',
    ['mugla', 'bodrum', 37.0344, 27.4305],
    3,
    'Denize sıfır koy oteli.',
    { beachfront: true },
  ),
  D(
    'Gümüşlük Balıkçı Restoran',
    'PLACE',
    'restoranlar',
    ['mugla', 'bodrum', 37.0567, 27.2306],
    3,
    'Gün batımında balık.',
    { specialOccasion: true },
  ),
  D(
    'Yamaç Paraşütü Fethiye',
    'EXPERIENCE',
    'macera-ve-spor-aktiviteleri',
    ['mugla', 'fethiye', 36.5498, 29.1158],
    3,
    'Babadağ’dan tandem uçuş.',
    { guided: true },
  ),
  D(
    'Gizli Vadi Koyu Fethiye',
    'POI',
    'dogal-guzellikler',
    ['mugla', 'fethiye', 36.5236, 29.1072],
    null,
    'Tekneyle ulaşılan vadi ve koy.',
  ),
  D(
    'Marmaris Mavi Tur Teknesi',
    'EXPERIENCE',
    'tekne-turlari',
    ['mugla', 'marmaris', 36.855, 28.2742],
    3,
    'Günübirlik mavi tur.',
    { familyFriendly: true },
  ),
  D(
    'Datça Badem Pansiyonu',
    'LODGING',
    'pansiyonlar',
    ['mugla', 'datca', 36.7386, 27.6866],
    2,
    'Sakin koyda uygun fiyatlı pansiyon.',
    { beachfront: true },
  ),
  D(
    'Göl Kıyısı Yürüyüşü Köyceğiz',
    'POI',
    'dogal-guzellikler',
    ['mugla', 'koycegiz', 36.9708, 28.6874],
    null,
    'Göl kıyısı yürüyüş ve kuş gözlemi.',
    { familyFriendly: true },
  ),
  D(
    'Dalaman Havalimanı Oto Kiralama',
    'SERVICE_PROVIDER',
    'arac-kiralama',
    ['mugla', 'dalaman', 36.7131, 28.7925],
    2,
    'Havalimanı teslim günlük kiralama.',
  ),
  D(
    'Uçurtma Okulu Ula',
    'EXPERIENCE',
    'macera-ve-spor-aktiviteleri',
    ['mugla', 'ula', 37.0547, 28.3255],
    2,
    'Rüzgâr sörfü ve uçurtma dersleri.',
  ),
  // Nevşehir / Kapadokya
  D(
    'Göreme Balon Turu',
    'EXPERIENCE',
    'macera-ve-spor-aktiviteleri',
    ['nevsehir', 'merkez', 38.6431, 34.8289],
    4,
    'Gün doğumunda sıcak hava balonu.',
    { guided: true },
  ),
  D(
    'Kapadokya Vadi Yürüyüşü',
    'EXPERIENCE',
    'yuruyus-turlari',
    ['nevsehir', 'urgup', 38.6305, 34.9122],
    2,
    'Rehberli vadi yürüyüşü.',
    { guided: true, familyFriendly: true },
  ),
  D(
    'Ürgüp Çevre Turu',
    'EXPERIENCE',
    'ozel-turlar',
    ['nevsehir', 'urgup', 38.6316, 34.9133],
    2,
    'Rehberli kırmızı tur: peri bacaları ve müzeler.',
    { guided: true },
  ),
  D(
    'Derinkuyu Yeraltı Turu',
    'EXPERIENCE',
    'muze-ve-kultur-turlari',
    ['nevsehir', 'derinkuyu', 38.3737, 34.7347],
    2,
    'Rehberli yeraltı şehri gezisi.',
    { guided: true },
  ),
  D(
    'Avanos Çömlek Atölyesi',
    'EXPERIENCE',
    'aile-ve-cocuk-aktiviteleri',
    ['nevsehir', 'avanos', 38.7151, 34.8467],
    1,
    'Çocuklarla çömlek yapımı.',
    { familyFriendly: true },
  ),
  D(
    'Kapadokya Mağara Otel',
    'LODGING',
    'butik-oteller',
    ['nevsehir', 'urgup', 38.6295, 34.9118],
    3,
    'Kaya oyma odalarda konaklama.',
  ),
  D(
    'Göreme Taş Ev Pansiyonu',
    'LODGING',
    'pansiyonlar',
    ['nevsehir', 'merkez', 38.6435, 34.8301],
    1,
    'Uygun fiyatlı taş ev pansiyonu.',
    { familyFriendly: true },
  ),
  D(
    'Peri Bacaları Vadisi Avanos',
    'POI',
    'dogal-guzellikler',
    ['nevsehir', 'avanos', 38.6714, 34.8505],
    null,
    'Peri bacaları vadisi.',
    { familyFriendly: true },
  ),
  D(
    'Dere Vadisi Gülşehir',
    'POI',
    'dogal-guzellikler',
    ['nevsehir', 'gulsehir', 38.7442, 34.6214],
    null,
    'Dere boyunca doğa yürüyüşü.',
  ),
  // Tatil bölgeleri (destinasyon)
  D(
    'Ege Kıyıları Tatil Bölgesi',
    'DESTINATION',
    'tatil-bolgeleri',
    ['mugla', null],
    null,
    'Koylar, sakin kasabalar ve çocuklu aileler için plajlar.',
    { familyFriendly: true },
  ),
  D(
    'Akdeniz Sahilleri Tatil Bölgesi',
    'DESTINATION',
    'tatil-bolgeleri',
    ['antalya', null],
    null,
    'Çocuklarla tatil için sığ plajlar ve tatil köyleri.',
    { familyFriendly: true },
  ),
  // Ürünler (konumsuz)
  D(
    'Kablosuz Kulaklık K1',
    'PRODUCT',
    'kulakliklar',
    ['', null],
    1,
    'Bütçe dostu kablosuz kulak içi kulaklık.',
    { wireless: true },
    { brand: 'Örnekmarka', model: 'K1' },
  ),
  D(
    'Kablosuz Kulaklık K2 Pro',
    'PRODUCT',
    'kulakliklar',
    ['', null],
    3,
    'Gürültü engellemeli kablosuz kulaklık.',
    { wireless: true },
    { brand: 'Örnekmarka', model: 'K2 Pro' },
  ),
  D(
    'Kulak Üstü Kulaklık Ses S5',
    'PRODUCT',
    'kulakliklar',
    ['', null],
    2,
    'Kablolu stüdyo kulaklığı.',
    { wireless: false },
    { brand: 'Demoses', model: 'S5' },
  ),
  D(
    'Spor Kulaklık Koşu R2',
    'PRODUCT',
    'kulakliklar',
    ['', null],
    2,
    'Ter dayanımlı kablosuz spor kulaklık.',
    { wireless: true },
    { brand: 'Demoses', model: 'R2' },
  ),
];

/**
 * Demo listelemeleri idempotent yükler (slug çakışırsa atlar). Yalnızca yerel/test/staging (guard).
 * Dönüş: oluşturulan listeleme kimlikleri.
 */
export async function seedDemoListings(prisma: PrismaClient): Promise<string[]> {
  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const catId = new Map(categories.map((c) => [c.slug, c.id]));
  const provinces = await prisma.adminArea.findMany({ where: { level: 'PROVINCE' } });
  const created: string[] = [];
  for (const d of DEMO_LISTINGS) {
    const slug = slugifyTr(d.name);
    if (await prisma.listing.findUnique({ where: { slug } })) continue;
    const categoryId = catId.get(d.category);
    if (!categoryId) throw new Error(`Demo veri: bilinmeyen kategori ${d.category}`);
    const province = d.province ? provinces.find((p) => p.slug === d.province) : undefined;
    const district =
      province && d.district
        ? await prisma.adminArea.findFirst({ where: { parentId: province.id, slug: d.district } })
        : null;
    if (d.province && !province) throw new Error(`Demo veri: bilinmeyen il ${d.province}`);
    const listing = await prisma.listing.create({
      data: {
        kind: d.kind,
        slug,
        name: d.name,
        shortDescription: d.short,
        primaryCategoryId: categoryId,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        priceLevel: d.priceLevel,
        attributes: (d.attributes ?? {}) as Prisma.InputJsonObject,
        dataOrigin: 'DEMO',
        source: 'Kurgusal demo verisi (§12.4)',
        ...(province
          ? {
              location: {
                create: {
                  provinceId: province.id,
                  districtId: district?.id ?? null,
                  latitude: d.lat ?? null,
                  longitude: d.lng ?? null,
                },
              },
            }
          : {}),
        ...(d.product ? { product: { create: d.product } } : {}),
      },
    });
    created.push(listing.id);
  }
  return created;
}
