import type {
  ArticleBody,
  ArticleType,
  CommercialRelation,
  ExperienceType,
} from '@incelemeler/contracts';

export interface Issue {
  pointer: string;
  code: string;
}

export interface ArticleRuleInput {
  type: ArticleType;
  title: string;
  body: ArticleBody;
  interestDeclared: boolean;
  commercialRelation: CommercialRelation;
  experienceType: ExperienceType | null;
  selectionMethod: string | null;
  /** Gövdedeki ve kapak görsellerinin lisans durumu (Ek A14.6). */
  media: ReadonlyArray<{ id: string; licenseComplete: boolean; altText: string | null }>;
  /** Gövdedeki listeleme kartlarının var olup olmadığı. */
  missingListingIds: readonly string[];
}

/**
 * İncelemeye gönderme ve yayın için kurallar (REQ-ICR-004/007/008, Ç-13).
 * Boş dizi = gönderilebilir/yayımlanabilir.
 */
export function articleBlockers(a: ArticleRuleInput): Issue[] {
  const out: Issue[] = [];
  const add = (pointer: string, code: string) => out.push({ pointer, code });
  if (!a.body.some((b) => b.type === 'paragraph' || b.type === 'list'))
    add('/body', 'body_required');
  if (!a.interestDeclared) add('/interestDeclared', 'interest_declaration_required');
  if (a.type === 'SPONSORED' && a.commercialRelation !== 'SPONSORED') {
    add('/commercialRelation', 'sponsored_relation_required');
  }
  if (a.type !== 'SPONSORED' && a.commercialRelation === 'SPONSORED') {
    add('/commercialRelation', 'sponsored_type_required');
  }
  if (a.type === 'LIST' && !a.selectionMethod) add('/selectionMethod', 'selection_method_required');
  if (a.type === 'REVIEW' && !a.experienceType) add('/experienceType', 'experience_required');
  if (a.type === 'SPONSORED' && a.experienceType && a.experienceType !== 'RESEARCH_ONLY') {
    // Sponsorlu içerik deneyim/puan iddiası taşıyan inceleme gibi sunulamaz (Ç-13).
    add('/experienceType', 'sponsored_no_review');
  }
  if (a.media.some((m) => !m.licenseComplete)) add('/body', 'media_license_incomplete');
  if (a.media.some((m) => !m.altText)) add('/body', 'media_alt_required');
  if (a.missingListingIds.length) add('/body', 'listing_not_found');
  return out;
}

/** Gövdede geçen görsel ve listeleme kimlikleri. */
export function referencedIds(body: ArticleBody): { mediaIds: string[]; listingIds: string[] } {
  const mediaIds = new Set<string>();
  const listingIds = new Set<string>();
  for (const b of body) {
    if (b.type === 'image') mediaIds.add(b.mediaId);
    if (b.type === 'gallery') b.mediaIds.forEach((m) => mediaIds.add(m));
    if (b.type === 'listingCard') listingIds.add(b.listingId);
  }
  return { mediaIds: [...mediaIds], listingIds: [...listingIds] };
}
