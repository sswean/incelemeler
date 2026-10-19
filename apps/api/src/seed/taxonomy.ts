import type { ListingKind } from '@incelemeler/contracts';
import { slugifyTr } from '@incelemeler/utils';

export interface SeedCategory {
  name: string;
  kinds: ListingKind[];
  children?: SeedCategory[];
  ymyl?: boolean;
  requiresLicense?: boolean;
  sponsorshipAllowed?: boolean;
  /** Başlangıç değerlendirme kriterleri (Ek A6.3); alt kategoriler devralır. */
  criteria?: readonly string[];
}

/**
 * Başlangıç kategori ağacı — v2 Ek A4.2 (v1 §4'ün tamamı, beş eksen modeline göre).
 * Özellikler (aile dostu, vegan…) ve içerik türleri (şehir rehberleri…) burada KATEGORİ DEĞİLDİR.
 * Bu bir platform taksonomisidir (EDITORIAL); kurgusal işletme/ürün içermez.
 */
const C = {
  place: ['Lezzet', 'Servis', 'Ortam', 'Temizlik', 'Fiyat/performans'],
  lodging: ['Konum', 'Temizlik', 'Oda konforu', 'Personel', 'Yeme-içme', 'Fiyat/performans'],
  carRental: [
    'Teslim alma süreci',
    'Araç durumu',
    'Fiyat şeffaflığı',
    'Depozito/iade süreci',
    'Müşteri hizmeti',
  ],
  guide: ['Bilgi birikimi', 'İletişim ve dil', 'Dakiklik/organizasyon', 'Fiyat/performans'],
  experience: [
    'Organizasyon',
    'Rehberlik',
    'Güvenlik hissi',
    'Beklentiyle uyum',
    'Fiyat/performans',
  ],
  product: ['Performans', 'Yapı kalitesi', 'Kullanım kolaylığı', 'Fiyat/performans'],
  headphones: ['Ses', 'Konfor', 'Pil', 'Mikrofon', 'Yapı kalitesi', 'Fiyat/performans'],
  service: ['İş kalitesi', 'Dakiklik', 'İletişim', 'Fiyat şeffaflığı'],
  event: ['Organizasyon', 'Mekan ve ulaşım', 'Ses-görüntü', 'Fiyat/performans'],
} as const;

export const BASE_TAXONOMY: SeedCategory[] = [
  {
    name: 'Yeme-İçme',
    kinds: ['PLACE'],
    criteria: C.place,
    children: [
      { name: 'Restoranlar', kinds: ['PLACE'] },
      { name: 'Kafeler', kinds: ['PLACE'] },
      { name: 'Kahvaltı Mekanları', kinds: ['PLACE'] },
      { name: 'Fast Food', kinds: ['PLACE'] },
      { name: 'Yerel Mutfaklar', kinds: ['PLACE'] },
      { name: 'Fine Dining', kinds: ['PLACE'] },
      { name: 'Tatlıcılar ve Pastaneler', kinds: ['PLACE'] },
      { name: 'Sokak Lezzetleri', kinds: ['PLACE'] },
    ],
  },
  {
    name: 'Konaklama',
    kinds: ['LODGING'],
    criteria: C.lodging,
    requiresLicense: true,
    children: [
      { name: 'Oteller', kinds: ['LODGING'], requiresLicense: true },
      { name: 'Butik Oteller', kinds: ['LODGING'], requiresLicense: true },
      { name: 'Tatil Köyleri', kinds: ['LODGING'], requiresLicense: true },
      { name: 'Pansiyonlar', kinds: ['LODGING'], requiresLicense: true },
      { name: 'Apart Oteller', kinds: ['LODGING'], requiresLicense: true },
      { name: 'Kiralık Tatil Evleri', kinds: ['LODGING'], requiresLicense: true },
      { name: 'Kamp ve Karavan Alanları', kinds: ['LODGING'], requiresLicense: true },
    ],
  },
  {
    name: 'Gezilecek Yerler',
    kinds: ['POI', 'DESTINATION'],
    children: [
      { name: 'Plajlar', kinds: ['POI'] },
      { name: 'Doğal Güzellikler', kinds: ['POI'] },
      { name: 'Kültürel Mekanlar', kinds: ['POI'] },
      { name: 'Tatil Bölgeleri', kinds: ['DESTINATION'] },
    ],
  },
  {
    name: 'Araç ve Ulaşım',
    kinds: ['PRODUCT', 'SERVICE_PROVIDER'],
    children: [
      { name: 'Otomobiller', kinds: ['PRODUCT'], criteria: C.product },
      { name: 'Motosiklet ve Scooter', kinds: ['PRODUCT'], criteria: C.product },
      { name: 'Araç Kiralama', kinds: ['SERVICE_PROVIDER'], criteria: C.carRental },
      { name: 'Transfer Hizmetleri', kinds: ['SERVICE_PROVIDER'], criteria: C.service },
    ],
  },
  {
    name: 'Turlar ve Aktiviteler',
    kinds: ['EXPERIENCE', 'GUIDE_PERSON'],
    criteria: C.experience,
    children: [
      {
        name: 'Turist Rehberleri',
        kinds: ['GUIDE_PERSON'],
        requiresLicense: true,
        criteria: C.guide,
      },
      { name: 'Özel Turlar', kinds: ['EXPERIENCE'], requiresLicense: true },
      { name: 'Yürüyüş Turları', kinds: ['EXPERIENCE'] },
      { name: 'Müze ve Kültür Turları', kinds: ['EXPERIENCE'] },
      { name: 'Tekne Turları', kinds: ['EXPERIENCE'] },
      { name: 'Doğa Aktiviteleri', kinds: ['EXPERIENCE'] },
      { name: 'Macera ve Spor Aktiviteleri', kinds: ['EXPERIENCE'] },
      { name: 'Gastronomi Turları', kinds: ['EXPERIENCE'] },
      { name: 'Fotoğraf Turları', kinds: ['EXPERIENCE'] },
      { name: 'Aile ve Çocuk Aktiviteleri', kinds: ['EXPERIENCE'] },
    ],
  },
  {
    name: 'Teknoloji',
    kinds: ['PRODUCT'],
    criteria: C.product,
    children: [
      { name: 'Telefonlar', kinds: ['PRODUCT'] },
      { name: 'Bilgisayarlar', kinds: ['PRODUCT'] },
      { name: 'Tabletler', kinds: ['PRODUCT'] },
      { name: 'Kulaklıklar', kinds: ['PRODUCT'], criteria: C.headphones },
      { name: 'Akıllı Saatler', kinds: ['PRODUCT'] },
      { name: 'Oyun Konsolları', kinds: ['PRODUCT'] },
      { name: 'Oyun Ekipmanları', kinds: ['PRODUCT'] },
      { name: 'Ev Elektroniği', kinds: ['PRODUCT'] },
      { name: 'Beyaz Eşya', kinds: ['PRODUCT'] },
      { name: 'Akıllı Ev Ürünleri', kinds: ['PRODUCT'] },
      { name: 'Fotoğraf ve Video Ekipmanları', kinds: ['PRODUCT'] },
      { name: 'Teknoloji Aksesuarları', kinds: ['PRODUCT'] },
    ],
  },
  {
    name: 'Moda ve Kişisel Bakım',
    kinds: ['PRODUCT', 'PLACE', 'SERVICE_PROVIDER'],
    children: [
      { name: 'Giyim', kinds: ['PRODUCT'], criteria: C.product },
      { name: 'Ayakkabı', kinds: ['PRODUCT'], criteria: C.product },
      { name: 'Çanta ve Aksesuarlar', kinds: ['PRODUCT'], criteria: C.product },
      { name: 'Kozmetik', kinds: ['PRODUCT'], criteria: C.product },
      { name: 'Cilt ve Saç Bakımı', kinds: ['PRODUCT'], criteria: C.product },
      { name: 'Parfümler', kinds: ['PRODUCT'], criteria: C.product },
      { name: 'Güzellik Merkezleri', kinds: ['PLACE'] },
      { name: 'Kuaförler ve Berberler', kinds: ['PLACE'] },
      { name: 'Kişisel Bakım Hizmetleri', kinds: ['SERVICE_PROVIDER'], criteria: C.service },
    ],
  },
  {
    name: 'Ev ve Yaşam',
    kinds: ['PRODUCT', 'SERVICE_PROVIDER', 'PLACE'],
    children: [
      { name: 'Ev Eşyaları', kinds: ['PRODUCT'], criteria: C.product },
      { name: 'Mobilya', kinds: ['PRODUCT'], criteria: C.product },
      { name: 'Dekorasyon', kinds: ['PRODUCT'], criteria: C.product },
      { name: 'Mutfak Ürünleri', kinds: ['PRODUCT'], criteria: C.product },
      { name: 'Evcil Hayvan Ürünleri', kinds: ['PRODUCT'], criteria: C.product },
      { name: 'Temizlik Hizmetleri', kinds: ['SERVICE_PROVIDER'], criteria: C.service },
      { name: 'Taşınma Hizmetleri', kinds: ['SERVICE_PROVIDER'], criteria: C.service },
      { name: 'Evcil Hayvan Hizmetleri', kinds: ['SERVICE_PROVIDER'], criteria: C.service },
      { name: 'Spor Salonları', kinds: ['PLACE'] },
    ],
  },
  {
    name: 'Etkinlik ve Kültür',
    kinds: ['EVENT', 'PLACE'],
    children: [
      { name: 'Konserler', kinds: ['EVENT'], criteria: C.event },
      { name: 'Sergiler', kinds: ['EVENT'], criteria: C.event },
      { name: 'Festivaller', kinds: ['EVENT'], criteria: C.event },
      { name: 'Tiyatro', kinds: ['EVENT'], criteria: C.event },
      { name: 'Etkinlik Mekanları', kinds: ['PLACE'] },
    ],
  },
];

export interface FlatCategory {
  slug: string;
  name: string;
  parentSlug: string | null;
  allowedKinds: ListingKind[];
  sortOrder: number;
  requiresLicense: boolean;
  ymyl: boolean;
  sponsorshipAllowed: boolean;
  requiresExpertReview: boolean;
  criteria: readonly string[];
}

/** Ağacı sıralı düz listeye çevirir; slug'lar global olarak benzersizdir. */
export function flattenTaxonomy(tree: SeedCategory[] = BASE_TAXONOMY): FlatCategory[] {
  const out: FlatCategory[] = [];
  const walk = (nodes: SeedCategory[], parentSlug: string | null) => {
    nodes.forEach((node, i) => {
      const slug = slugifyTr(node.name);
      out.push({
        slug,
        name: node.name,
        parentSlug,
        allowedKinds: node.kinds,
        sortOrder: (i + 1) * 10,
        requiresLicense: node.requiresLicense ?? false,
        ymyl: node.ymyl ?? false,
        // REQ-KAT-004: YMYL ve lisanslı kategoride sponsorluk kapalı; YMYL'de uzman incelemesi zorunlu.
        sponsorshipAllowed:
          !(node.ymyl || node.requiresLicense) && (node.sponsorshipAllowed ?? true),
        requiresExpertReview: node.ymyl ?? false,
        criteria: node.criteria ?? [],
      });
      if (node.children) walk(node.children, slug);
    });
  };
  walk(tree, null);
  return out;
}
