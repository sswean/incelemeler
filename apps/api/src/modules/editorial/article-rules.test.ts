import { describe, expect, it } from 'vitest';
import { type ArticleRuleInput, articleBlockers, referencedIds } from './article-rules.js';

const base: ArticleRuleInput = {
  type: 'GUIDE',
  title: 'Kadıköy gezi rehberi',
  body: [{ type: 'paragraph', content: [{ text: 'Merhaba' }] }],
  interestDeclared: true,
  commercialRelation: 'NONE',
  experienceType: null,
  selectionMethod: null,
  media: [],
  missingListingIds: [],
};
const codes = (p: Partial<ArticleRuleInput>) =>
  articleBlockers({ ...base, ...p }).map((i) => i.code);

describe('[REQ-ICR-004] [REQ-ICR-007] [REQ-ICR-008] içerik kuralları', () => {
  it('eksiksiz rehber gönderilebilir', () => {
    expect(codes({})).toEqual([]);
  });
  it('menfaat beyanı sorusu yanıtlanmadan gönderilemez; boş gövde olmaz', () => {
    expect(codes({ interestDeclared: false, body: [] })).toEqual([
      'body_required',
      'interest_declaration_required',
    ]);
  });
  it('liste: seçim yöntemi; inceleme: deneyim beyanı zorunlu', () => {
    expect(codes({ type: 'LIST' })).toEqual(['selection_method_required']);
    expect(codes({ type: 'REVIEW' })).toEqual(['experience_required']);
  });
  it('sponsorlu ilişki yalnız sponsorlu içerik türünde; sponsorlu içerik inceleme gibi sunulamaz', () => {
    expect(codes({ commercialRelation: 'SPONSORED' })).toEqual(['sponsored_type_required']);
    expect(codes({ type: 'SPONSORED' })).toEqual(['sponsored_relation_required']);
    expect(
      codes({
        type: 'SPONSORED',
        commercialRelation: 'SPONSORED',
        experienceType: 'TESTED_IN_PERSON',
      }),
    ).toEqual(['sponsored_no_review']);
  });
  it('[REQ-VER-014] lisansı eksik görsel ve olmayan listeleme kartı yayını engeller', () => {
    expect(
      codes({
        media: [{ id: 'm', licenseComplete: false, altText: null }],
        missingListingIds: ['x'],
      }),
    ).toEqual(['media_license_incomplete', 'media_alt_required', 'listing_not_found']);
  });
  it('gövdede geçen görsel ve listeleme kimlikleri', () => {
    expect(
      referencedIds([
        { type: 'image', mediaId: 'a' },
        { type: 'gallery', mediaIds: ['a', 'b'] },
        { type: 'listingCard', listingId: 'l' },
      ]),
    ).toEqual({ mediaIds: ['a', 'b'], listingIds: ['l'] });
  });
});
