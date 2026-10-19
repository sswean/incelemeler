import { z } from 'zod';
import { PageInfo } from './taxonomy.js';

/** İçerik türleri (REQ-ICR-004). Sponsorlu içerikte puanlama blokları kullanılamaz (Ç-13). */
export const ArticleType = z.enum(['GUIDE', 'LIST', 'COMPARISON', 'REVIEW', 'NEWS', 'SPONSORED']);
export type ArticleType = z.infer<typeof ArticleType>;

/** Yayın akışı (REQ-ICR-005). */
export const ArticleStatus = z.enum([
  'DRAFT',
  'IN_REVIEW',
  'APPROVED',
  'SCHEDULED',
  'PUBLISHED',
  'ARCHIVED',
]);
export type ArticleStatus = z.infer<typeof ArticleStatus>;

/** Ticari ilişki (REQ-ICR-008, Ek A8.2). */
export const CommercialRelation = z.enum(['NONE', 'GIFTED', 'SPONSORED', 'AFFILIATE']);
export type CommercialRelation = z.infer<typeof CommercialRelation>;

/** Deneyim beyanı (REQ-ICR-007). RESEARCH_ONLY'de editör puanı verilemez. */
export const ExperienceType = z.enum([
  'TESTED_IN_PERSON',
  'VISITED',
  'STAYED',
  'USED_LONG_TERM',
  'RESEARCH_ONLY',
]);
export type ExperienceType = z.infer<typeof ExperienceType>;

// ── Bloklar (REQ-ICR-001/002) ──

/** Satır içi metin: kalın, italik, bağlantı. Ham HTML yok (XSS). */
const InlineText = z.object({
  text: z.string().min(1).max(5000),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  href: z
    .url({ protocol: /^https?$/ })
    .max(500)
    .optional(),
});
const RichText = z.array(InlineText).min(1).max(100);

export const Block = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('heading'),
    level: z.union([z.literal(2), z.literal(3)]),
    text: z.string().trim().min(1).max(200),
  }),
  z.object({ type: z.literal('paragraph'), content: RichText }),
  z.object({
    type: z.literal('list'),
    ordered: z.boolean(),
    items: z.array(RichText).min(1).max(50),
  }),
  z.object({
    type: z.literal('image'),
    mediaId: z.uuid(),
    caption: z.string().trim().max(300).optional(),
  }),
  z.object({
    type: z.literal('gallery'),
    mediaIds: z.array(z.uuid()).min(2).max(30),
  }),
  z.object({
    type: z.literal('table'),
    header: z.array(z.string().trim().max(100)).min(1).max(10),
    rows: z
      .array(z.array(z.string().trim().max(300)).min(1).max(10))
      .min(1)
      .max(100),
    caption: z.string().trim().max(200).optional(),
  }),
  /** Canlı veriye bağlı listeleme kartı (REQ-ICR-003). */
  z.object({
    type: z.literal('listingCard'),
    listingId: z.uuid(),
    note: z.string().trim().max(500).optional(),
  }),
  z.object({
    type: z.literal('infoBox'),
    tone: z.enum(['tip', 'warning']),
    content: RichText,
  }),
  z.object({
    type: z.literal('prosCons'),
    pros: z.array(z.string().trim().min(1).max(200)).max(20),
    cons: z.array(z.string().trim().min(1).max(200)).max(20),
  }),
  z.object({
    type: z.literal('faq'),
    items: z
      .array(z.object({ question: z.string().trim().min(1).max(300), answer: RichText }))
      .min(1)
      .max(30),
  }),
  z.object({
    type: z.literal('quote'),
    content: RichText,
    attribution: z.string().trim().max(200).optional(),
  }),
]);
export type Block = z.infer<typeof Block>;
export const ArticleBody = z.array(Block).max(400);
export type ArticleBody = z.infer<typeof ArticleBody>;

export const ArticleSource = z.object({
  title: z.string().trim().min(2).max(300),
  url: z
    .url({ protocol: /^https?$/ })
    .max(500)
    .optional(),
  accessedAt: z.iso.date().optional(),
});

// ── API ──

const articleFields = {
  title: z.string().trim().min(5).max(120),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  summary: z.string().trim().max(300).nullable(),
  body: ArticleBody,
  heroMediaId: z.uuid().nullable(),
  sources: z.array(ArticleSource).max(50),
  /** Menfaat beyanı sorusu yanıtlanmadan incelemeye gönderilemez (REQ-ICR-008). */
  interestDeclared: z.boolean(),
  commercialRelation: CommercialRelation,
  /** Yalnızca REVIEW (ve deneyim anlatan içerik) için. */
  experienceType: ExperienceType.nullable(),
  experienceNote: z.string().trim().max(200).nullable(),
  /** LIST türünde ZORUNLU: "Seçim yöntemi" kutusu (REQ-ICR-004). */
  selectionMethod: z.string().trim().max(1000).nullable(),
};

export const ArticleCreateBody = z
  .object({ type: ArticleType, title: articleFields.title, slug: articleFields.slug.optional() })
  .strict()
  .meta({ id: 'ArticleCreateBody' });
export type ArticleCreateBody = z.infer<typeof ArticleCreateBody>;

export const ArticleUpdateBody = z
  .object({
    version: z.number().int().min(1),
    ...articleFields,
    /** Yayımlanmış içerikte anlamlı değişiklik: "son güncelleme" ve güncelleme notu (REQ-ICR-006). */
    significantChange: z.boolean(),
    changeNote: z.string().trim().min(3).max(300),
  })
  .partial()
  .required({ version: true })
  .strict()
  .meta({ id: 'ArticleUpdateBody' });
export type ArticleUpdateBody = z.infer<typeof ArticleUpdateBody>;

export const ArticleTransitionBody = z
  .object({
    version: z.number().int().min(1),
    to: ArticleStatus,
    /** SCHEDULED için yayın zamanı (Europe/Istanbul arayüzde, UTC saklanır). */
    scheduledAt: z.iso.datetime().optional(),
  })
  .strict()
  .meta({ id: 'ArticleTransitionBody' });
export type ArticleTransitionBody = z.infer<typeof ArticleTransitionBody>;

export const ArticleCorrectionBody = z
  .object({ version: z.number().int().min(1), note: z.string().trim().min(5).max(500) })
  .strict()
  .meta({ id: 'ArticleCorrectionBody' });

const Note = z.object({ date: z.iso.datetime(), note: z.string() });

export const AdminArticle = z
  .object({
    id: z.string(),
    type: ArticleType,
    slug: z.string(),
    title: z.string(),
    summary: z.string().nullable(),
    body: ArticleBody,
    heroMediaId: z.string().nullable(),
    sources: z.array(ArticleSource),
    status: ArticleStatus,
    interestDeclared: z.boolean(),
    commercialRelation: CommercialRelation,
    experienceType: ExperienceType.nullable(),
    experienceNote: z.string().nullable(),
    selectionMethod: z.string().nullable(),
    author: z.object({ id: z.string(), displayName: z.string() }),
    editor: z.object({ id: z.string(), displayName: z.string() }).nullable(),
    scheduledAt: z.iso.datetime().nullable(),
    publishedAt: z.iso.datetime().nullable(),
    lastSignificantUpdateAt: z.iso.datetime().nullable(),
    updateNotes: z.array(Note),
    corrections: z.array(Note),
    updatedAt: z.iso.datetime(),
    version: z.number().int(),
    /** Yayın ya da incelemeye gönderme için eksikler. */
    blockers: z.array(z.object({ pointer: z.string(), code: z.string() })),
  })
  .meta({ id: 'AdminArticle' });
export type AdminArticle = z.infer<typeof AdminArticle>;

export const AdminArticleSummary = z
  .object({
    id: z.string(),
    type: ArticleType,
    slug: z.string(),
    title: z.string(),
    status: ArticleStatus,
    authorName: z.string(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: 'AdminArticleSummary' });
export const AdminArticleList = z
  .object({ data: z.array(AdminArticleSummary), page: PageInfo })
  .meta({ id: 'AdminArticleList' });
export type AdminArticleList = z.infer<typeof AdminArticleList>;
export const AdminArticleListQuery = z.object({
  type: ArticleType.optional(),
  status: ArticleStatus.optional(),
  mine: z.enum(['1']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});
export type AdminArticleListQuery = z.infer<typeof AdminArticleListQuery>;

export const PreviewLink = z
  .object({ url: z.string(), expiresAt: z.iso.datetime() })
  .meta({ id: 'PreviewLink' });

// ── Herkese açık ──

/** Gömülü listeleme kartı: canlı veriden (REQ-ICR-003). */
export const ListingCardData = z.object({
  id: z.string(),
  kind: z.string(),
  slug: z.string(),
  name: z.string(),
  status: z.string(),
  carRental: z.boolean(),
  categoryName: z.string(),
  place: z.string().nullable(),
  priceLevel: z.number().int().nullable(),
  reviewCount: z.number().int(),
  /** Herkese açık değilse (taslak/silinmiş) kart gösterilmez. */
  visible: z.boolean(),
});
export type ListingCardData = z.infer<typeof ListingCardData>;

export const PublicMedia = z.object({
  id: z.string(),
  width: z.number().int(),
  height: z.number().int(),
  altText: z.string(),
  credit: z.string(),
  blurhash: z.string().nullable(),
});

export const PublicArticle = z
  .object({
    id: z.string(),
    type: ArticleType,
    slug: z.string(),
    title: z.string(),
    summary: z.string().nullable(),
    body: ArticleBody,
    hero: PublicMedia.nullable(),
    sources: z.array(ArticleSource),
    commercialRelation: CommercialRelation,
    experienceType: ExperienceType.nullable(),
    experienceNote: z.string().nullable(),
    selectionMethod: z.string().nullable(),
    author: z.object({ displayName: z.string(), slug: z.string().nullable() }),
    editor: z.object({ displayName: z.string() }).nullable(),
    status: ArticleStatus,
    publishedAt: z.iso.datetime().nullable(),
    lastSignificantUpdateAt: z.iso.datetime().nullable(),
    updateNotes: z.array(z.object({ date: z.iso.datetime(), note: z.string() })),
    corrections: z.array(z.object({ date: z.iso.datetime(), note: z.string() })),
    dataOrigin: z.string(),
    /** Gövdede kullanılan lisanslı görseller (lisansı eksik olan gösterilmez). */
    media: z.record(z.string(), PublicMedia),
    listings: z.record(z.string(), ListingCardData),
  })
  .meta({ id: 'PublicArticle' });
export type PublicArticle = z.infer<typeof PublicArticle>;

export const PreviewQuery = z.object({ token: z.string().min(10).max(2000) });

export const ArticleSitemapPage = z
  .object({
    data: z.array(z.object({ type: ArticleType, slug: z.string(), lastmod: z.iso.datetime() })),
  })
  .meta({ id: 'ArticleSitemapPage' });

// ── Yazar profili (REQ-ICR-011) ──

export const AuthorLink = z.object({
  label: z.string().trim().min(2).max(60),
  url: z.url({ protocol: /^https$/ }).max(300),
});

export const AuthorProfileBody = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: z.string().trim().max(120).nullable(),
  bio: z.string().trim().max(2000).nullable(),
  expertise: z.array(z.string().trim().min(2).max(60)).max(12),
  /** Etik beyanı: menfaat ilişkileri, kabul edilen davet/ürün politikası. */
  ethics: z.string().trim().max(2000).nullable(),
  links: z.array(AuthorLink).max(6),
  /** Mevcut profil güncellenirken iyimser kilit; ilk oluşturmada verilmez. */
  version: z.number().int().positive().optional(),
});
export type AuthorProfileBody = z.infer<typeof AuthorProfileBody>;

export const AuthorProfile = z
  .object({
    displayName: z.string(),
    profile: AuthorProfileBody.omit({ version: true })
      .extend({ version: z.number().int(), updatedAt: z.iso.datetime() })
      .nullable(),
  })
  .meta({ id: 'AuthorProfile' });
export type AuthorProfile = z.infer<typeof AuthorProfile>;

export const PublicAuthor = z
  .object({
    displayName: z.string(),
    slug: z.string(),
    title: z.string().nullable(),
    bio: z.string().nullable(),
    expertise: z.array(z.string()),
    ethics: z.string().nullable(),
    links: z.array(AuthorLink),
    articles: z.array(
      z.object({
        type: ArticleType,
        slug: z.string(),
        title: z.string(),
        summary: z.string().nullable(),
        publishedAt: z.iso.datetime().nullable(),
      }),
    ),
  })
  .meta({ id: 'PublicAuthor' });
export type PublicAuthor = z.infer<typeof PublicAuthor>;
