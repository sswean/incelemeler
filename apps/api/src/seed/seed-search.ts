import { normalizeTr } from '@incelemeler/utils';
import type { AttributeType, Prisma, PrismaClient } from '../generated/prisma/client.js';
import { snapshotAttr } from '../modules/taxonomy/category-schema.service.js';

const fold = (s: string) => normalizeTr(s).folded;

/**
 * Arama için platform yapılandırması (Ek A7.1) — kurgusal veri değildir; idempotent, panel
 * değişikliklerini ezmez. Niyetlerin bağlandığı filtrelenebilir özellikler de burada tanımlanır.
 */
const ATTRIBUTES: Array<{
  category: string;
  key: string;
  label: string;
  type: AttributeType;
  showOnCard?: boolean;
}> = [
  {
    category: 'konaklama',
    key: 'beachfront',
    label: 'Denize sıfır',
    type: 'BOOL',
    showOnCard: true,
  },
  { category: 'konaklama', key: 'familyFriendly', label: 'Çocuk dostu', type: 'BOOL' },
  { category: 'yeme-icme', key: 'specialOccasion', label: 'Özel gün için uygun', type: 'BOOL' },
  { category: 'yeme-icme', key: 'familyFriendly', label: 'Çocuk dostu', type: 'BOOL' },
  {
    category: 'turlar-ve-aktiviteler',
    key: 'guided',
    label: 'Rehberli',
    type: 'BOOL',
    showOnCard: true,
  },
  { category: 'turlar-ve-aktiviteler', key: 'familyFriendly', label: 'Çocuk dostu', type: 'BOOL' },
  { category: 'gezilecek-yerler', key: 'familyFriendly', label: 'Çocuk dostu', type: 'BOOL' },
  { category: 'kulakliklar', key: 'wireless', label: 'Kablosuz', type: 'BOOL', showOnCard: true },
];

export const INTENTS: Array<{
  key: string;
  label: string;
  terms: string[];
  filter: Prisma.InputJsonObject;
}> = [
  {
    key: 'uygun-fiyat',
    label: 'Uygun fiyatlı',
    terms: ['uygun fiyatlı', 'bütçeye uygun', 'bütçe dostu', 'ucuz', 'ekonomik'],
    filter: { priceLevelMax: 2 },
  },
  {
    key: 'denize-yakin',
    label: 'Denize yakın',
    terms: ['denize yakın', 'denize sıfır', 'deniz kenarında', 'sahilde'],
    filter: { attributes: { beachfront: true } },
  },
  {
    key: 'cocuk-dostu',
    label: 'Çocuk dostu',
    terms: ['çocuklarla', 'çocuklu', 'çocuk dostu', 'aileyle', 'aile'],
    filter: { attributes: { familyFriendly: true } },
  },
  {
    key: 'ozel-gun',
    label: 'Özel gün',
    terms: ['özel gün', 'romantik', 'yıldönümü'],
    filter: { attributes: { specialOccasion: true } },
  },
  {
    key: 'rehberli',
    label: 'Rehberli',
    terms: ['rehberli'],
    filter: { attributes: { guided: true } },
  },
  {
    key: 'kablosuz',
    label: 'Kablosuz',
    terms: ['kablosuz'],
    filter: { attributes: { wireless: true } },
  },
];

export const SYNONYMS: Array<[string, string]> = [
  ['araba kiralama', 'araç kiralama'],
  ['oto kiralama', 'araç kiralama'],
  ['rent a car', 'araç kiralama'],
  ['kahvaltıcı', 'kahvaltı'],
  ['kahvaltı yeri', 'kahvaltı mekanları'],
  ['kahvaltı', 'kahvaltı mekanları'],
  ['hotel', 'otel'],
  ['lokanta', 'restoran'],
  ['akşam yemeği', 'restoran'],
  ['headphone', 'kulaklık'],
  ['tatil yerleri', 'tatil bölgeleri'],
  ['tatil yeri', 'tatil bölgeleri'],
  ['doğal güzellik', 'doğal güzellikler'],
  ['turları', 'turlar ve aktiviteler'],
  ['turu', 'turlar ve aktiviteler'],
  ['turlar', 'turlar ve aktiviteler'],
  ['tur', 'turlar ve aktiviteler'],
];

/** Yer adı takma adları → il (ve isteğe bağlı ilçe) slug'ı. */
const ALIASES: Array<{ alias: string; province: string; district?: string }> = [
  { alias: 'Kapadokya', province: 'nevsehir' },
  { alias: 'Cappadocia', province: 'nevsehir' },
  { alias: 'Göreme', province: 'nevsehir' },
  { alias: 'Sultanahmet', province: 'istanbul', district: 'fatih' },
  { alias: 'Taksim', province: 'istanbul', district: 'beyoglu' },
  { alias: 'Cihangir', province: 'istanbul', district: 'beyoglu' },
  { alias: 'Moda', province: 'istanbul', district: 'kadikoy' },
  { alias: 'Alaçatı', province: 'izmir', district: 'cesme' },
];

export async function seedSearchDefaults(prisma: PrismaClient): Promise<void> {
  for (const i of INTENTS) {
    await prisma.searchIntent.upsert({
      where: { key: i.key },
      create: { key: i.key, label: i.label, terms: i.terms, filter: i.filter },
      update: {},
    });
  }
  for (const [term, replacement] of SYNONYMS) {
    await prisma.searchSynonym.upsert({
      where: { term: fold(term) },
      create: { term: fold(term), replacement: fold(replacement) },
      update: {},
    });
  }
  for (const a of ALIASES) {
    const province = await prisma.adminArea.findFirst({
      where: { level: 'PROVINCE', slug: a.province },
    });
    if (!province) continue;
    const area = a.district
      ? await prisma.adminArea.findFirst({ where: { parentId: province.id, slug: a.district } })
      : province;
    if (!area) continue;
    await prisma.placeAlias.upsert({
      where: { aliasFold: fold(a.alias) },
      create: { alias: a.alias, aliasFold: fold(a.alias), adminAreaId: area.id },
      update: {},
    });
  }
  await seedAttributes(prisma);
}

/** Filtrelenebilir özellikler: yalnızca o anahtar kategoride yoksa eklenir; şema sürümleri güncellenir. */
async function seedAttributes(prisma: PrismaClient): Promise<void> {
  const categories = await prisma.category.findMany();
  const byId = new Map(categories.map((c) => [c.id, c]));
  const touched = new Set<string>();
  for (const a of ATTRIBUTES) {
    const c = categories.find((x) => x.slug === a.category);
    if (!c) continue;
    const exists = await prisma.attributeDefinition.findUnique({
      where: { categoryId_key: { categoryId: c.id, key: a.key } },
    });
    if (exists) continue;
    await prisma.attributeDefinition.create({
      data: {
        categoryId: c.id,
        key: a.key,
        label: a.label,
        type: a.type,
        filterable: true,
        showOnCard: a.showOnCard ?? false,
      },
    });
    touched.add(c.id);
  }
  if (!touched.size) return;
  // Etkilenen kategoriler ve alt ağaçları için yeni şema sürümü (REQ-VER-003).
  const affected = new Set<string>();
  const walk = (id: string) => {
    affected.add(id);
    categories.filter((c) => c.parentId === id).forEach((ch) => walk(ch.id));
  };
  touched.forEach(walk);
  for (const id of affected) {
    const chainIds: string[] = [];
    for (let cur = byId.get(id); cur; cur = cur.parentId ? byId.get(cur.parentId) : undefined) {
      chainIds.push(cur.id);
    }
    const defs = await prisma.attributeDefinition.findMany({
      where: { categoryId: { in: chainIds }, archivedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { key: 'asc' }],
    });
    const updated = await prisma.category.update({
      where: { id },
      data: { attributeSchemaVersion: { increment: 1 } },
    });
    await prisma.categorySchemaVersion.create({
      data: {
        categoryId: id,
        version: updated.attributeSchemaVersion,
        definitions: defs.map(snapshotAttr),
        createdBy: null,
      },
    });
  }
}
