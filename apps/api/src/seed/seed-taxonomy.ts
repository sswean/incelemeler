import type { PrismaClient } from '../generated/prisma/client.js';
import { flattenTaxonomy } from './taxonomy.js';

/** Taksonomiyi idempotent biçimde yükler (slug'a göre upsert). */
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
      status: 'PUBLISHED' as const,
      dataOrigin: 'EDITORIAL' as const,
    };
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, ...data },
      update: data,
    });
    idBySlug.set(c.slug, row.id);
  }
  return flat.length;
}
