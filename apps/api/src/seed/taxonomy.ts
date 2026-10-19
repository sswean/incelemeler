import type { ListingKind } from '@incelemeler/contracts';
import { slugifyTr } from '@incelemeler/utils';

export interface SeedCategory {
  name: string;
  kinds: ListingKind[];
  children?: SeedCategory[];
  ymyl?: boolean;
  requiresLicense?: boolean;
  sponsorshipAllowed?: boolean;
}

/**
 * Başlangıç kategori ağacı — v2 Ek A4.2 (v1 §4'ün tamamı, beş eksen modeline göre).
 * Özellikler (aile dostu, vegan…) ve içerik türleri (şehir rehberleri…) burada KATEGORİ DEĞİLDİR.
 * Bu bir platform taksonomisidir (EDITORIAL); kurgusal işletme/ürün içermez.
 */
export const BASE_TAXONOMY: SeedCategory[] = [
  {
    name: 'Yeme-İçme',
    kinds: ['PLACE'],
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
      { name: 'Otomobiller', kinds: ['PRODUCT'] },
      { name: 'Motosiklet ve Scooter', kinds: ['PRODUCT'] },
      { name: 'Araç Kiralama', kinds: ['SERVICE_PROVIDER'] },
      { name: 'Transfer Hizmetleri', kinds: ['SERVICE_PROVIDER'] },
    ],
  },
  {
    name: 'Turlar ve Aktiviteler',
    kinds: ['EXPERIENCE', 'GUIDE_PERSON'],
    children: [
      { name: 'Turist Rehberleri', kinds: ['GUIDE_PERSON'], requiresLicense: true },
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
    children: [
      { name: 'Telefonlar', kinds: ['PRODUCT'] },
      { name: 'Bilgisayarlar', kinds: ['PRODUCT'] },
      { name: 'Tabletler', kinds: ['PRODUCT'] },
      { name: 'Kulaklıklar', kinds: ['PRODUCT'] },
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
      { name: 'Giyim', kinds: ['PRODUCT'] },
      { name: 'Ayakkabı', kinds: ['PRODUCT'] },
      { name: 'Çanta ve Aksesuarlar', kinds: ['PRODUCT'] },
      { name: 'Kozmetik', kinds: ['PRODUCT'] },
      { name: 'Cilt ve Saç Bakımı', kinds: ['PRODUCT'] },
      { name: 'Parfümler', kinds: ['PRODUCT'] },
      { name: 'Güzellik Merkezleri', kinds: ['PLACE'] },
      { name: 'Kuaförler ve Berberler', kinds: ['PLACE'] },
      { name: 'Kişisel Bakım Hizmetleri', kinds: ['SERVICE_PROVIDER'] },
    ],
  },
  {
    name: 'Ev ve Yaşam',
    kinds: ['PRODUCT', 'SERVICE_PROVIDER', 'PLACE'],
    children: [
      { name: 'Ev Eşyaları', kinds: ['PRODUCT'] },
      { name: 'Mobilya', kinds: ['PRODUCT'] },
      { name: 'Dekorasyon', kinds: ['PRODUCT'] },
      { name: 'Mutfak Ürünleri', kinds: ['PRODUCT'] },
      { name: 'Evcil Hayvan Ürünleri', kinds: ['PRODUCT'] },
      { name: 'Temizlik Hizmetleri', kinds: ['SERVICE_PROVIDER'] },
      { name: 'Taşınma Hizmetleri', kinds: ['SERVICE_PROVIDER'] },
      { name: 'Evcil Hayvan Hizmetleri', kinds: ['SERVICE_PROVIDER'] },
      { name: 'Spor Salonları', kinds: ['PLACE'] },
    ],
  },
  {
    name: 'Etkinlik ve Kültür',
    kinds: ['EVENT', 'PLACE'],
    children: [
      { name: 'Konserler', kinds: ['EVENT'] },
      { name: 'Sergiler', kinds: ['EVENT'] },
      { name: 'Festivaller', kinds: ['EVENT'] },
      { name: 'Tiyatro', kinds: ['EVENT'] },
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
      });
      if (node.children) walk(node.children, slug);
    });
  };
  walk(tree, null);
  return out;
}
