import type { ArticleType, ListingKind, SearchSort } from '@incelemeler/contracts';

/**
 * Arama motoru arayüzü (REQ-ARA-001): uygulama kodu yalnızca bunu görür.
 * İlk uygulama PostgreSQL (PostgresSearchAdapter); harici motor yalnızca yeni adaptör gerektirir (ADR-0012).
 */
export const SEARCH_PORT = Symbol('SEARCH_PORT');

export type SearchDocType = 'LISTING' | 'ARTICLE' | 'CATEGORY' | 'PLACE';

export interface SearchDocumentInput {
  docType: SearchDocType;
  refId: string;
  title: string;
  subtitle: string | null;
  path: string;
  /** Ağırlıklı metin alanları: A başlık, B kategori/yer, C alt başlık, D gövde (REQ-ARA-004). */
  text: { a: string; b: string; c: string; d: string };
  kind: ListingKind | null;
  articleType: ArticleType | null;
  categoryIds: string[];
  provinceId: string | null;
  districtId: string | null;
  priceLevel: number | null;
  attributes: Record<string, unknown>;
  status: string | null;
  dataOrigin: string;
  ratingCount: number;
  ratingAvg: number | null;
  ratingBayes: number | null;
  lat: number | null;
  lng: number | null;
  publishedAt: Date | null;
}

export interface SearchCriteria {
  /** Katlanmış (aksansız) serbest metin kelimeleri. */
  tokens: string[];
  docTypes: Array<'LISTING' | 'ARTICLE'>;
  kind: ListingKind | null;
  categoryId: string | null;
  provinceId: string | null;
  districtId: string | null;
  priceMax: number | null;
  minRating: number | null;
  /** JSON içerme koşulu (özellik türüne göre hazırlanmış: bool, seçenek ya da çoklu seçenek dizisi). */
  attributes: Record<string, unknown>;
  excludeDemo: boolean;
  sort: SearchSort;
  near: { lat: number; lng: number } | null;
  offset: number;
  limit: number;
  /** Benzerlik (trigram) geri dönüşü: tam metin koşulu yerine ad benzerliği. */
  fuzzy: boolean;
  /** Kelimeler VE (varsayılan) ya da VEYA ile birleşir (VE sonuçsuzsa VEYA denenir). */
  matchAny: boolean;
  /**
   * Yalnızca bu belgeler arasında ara (sponsorlu aday alaka denetimi: aday organik ölçütlerle eşleşmeli —
   * REQ-SPN-004). Organik sorgularda hiç verilmez.
   */
  refIds?: string[];
}

export interface SearchRow {
  docType: 'LISTING' | 'ARTICLE';
  refId: string;
  title: string;
  subtitle: string | null;
  path: string;
  kind: ListingKind | null;
  articleType: ArticleType | null;
  status: string | null;
  priceLevel: number | null;
  ratingCount: number;
  distanceKm: number | null;
  dataOrigin: string;
}

export interface SuggestRow {
  docType: SearchDocType;
  title: string;
  subtitle: string | null;
  path: string;
}

export interface SearchPort {
  upsert(doc: SearchDocumentInput): Promise<void>;
  delete(docType: SearchDocType, refId: string): Promise<void>;
  query(c: SearchCriteria): Promise<{ rows: SearchRow[]; total: number }>;
  suggest(prefixTokens: string[], perGroup: number, excludeDemo: boolean): Promise<SuggestRow[]>;
}
