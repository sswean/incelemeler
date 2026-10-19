import { slugifyTr } from '@incelemeler/utils';
import type { PrismaClient } from '../generated/prisma/client.js';
import { flattenTaxonomy } from './taxonomy.js';

/**
 * Taksonomiyi idempotent biçimde yükler: eksik kategorileri oluşturur, var olanlara dokunmaz
 * (panelden yapılan değişiklikler yeniden seed ile ezilmez).
 */
export async function seedTaxonomy(prisma: PrismaClient): Promise<number> {
  const flat = flattenTaxonomy();
  const idBySlug = new Map<string, string>();
  for (const c of flat) {
    const parentId = c.parentSlug ? (idBySlug.get(c.parentSlug) ?? null) : null;
    const data = {
      name: c.name,
      parentId,
      allowedKinds: c.allowedKinds,
      sortOrder: c.sortOrder,
      requiresLicense: c.requiresLicense,
      ymyl: c.ymyl,
      sponsorshipAllowed: c.sponsorshipAllowed,
      requiresExpertReview: c.requiresExpertReview,
      status: 'PUBLISHED' as const,
      firstPublishedAt: new Date(),
      dataOrigin: 'EDITORIAL' as const,
    };
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, ...data },
      update: {},
    });
    idBySlug.set(c.slug, row.id);
    // Kriterler yalnızca hiç yapılandırılmamış kategoriye yüklenir (panel değişiklikleri korunur).
    if (
      c.criteria.length &&
      (await prisma.reviewCriterion.count({ where: { categoryId: row.id } })) === 0
    ) {
      await prisma.reviewCriterion.createMany({
        data: c.criteria.map((name, i) => ({
          categoryId: row.id,
          key: slugifyTr(name),
          name,
          sortOrder: (i + 1) * 10,
        })),
      });
    }
  }
  return flat.length;
}
