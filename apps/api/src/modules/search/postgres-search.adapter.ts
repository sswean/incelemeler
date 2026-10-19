import { Injectable } from '@nestjs/common';
import { normalizeTr } from '@incelemeler/utils';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  SearchCriteria,
  SearchDocType,
  SearchDocumentInput,
  SearchPort,
  SearchRow,
  SuggestRow,
} from './search.port.js';

const fold = (s: string) => normalizeTr(s).folded;
/** to_tsquery sözdizimine giremeyecek karakterleri ele (normalizasyon sonrası yalnızca harf/rakam beklenir). */
const safeToken = (t: string) => /^[\p{L}\p{N}]+$/u.test(t);
/** Benzerlik geri dönüşü eşiği (REQ-ARA-005; korpusla ayarlanır — ADR-0012). */
export const FUZZY_THRESHOLD = 0.4;

/**
 * PostgreSQL arama adaptörü (ADR-0012): `turkish` kök bulucu + `simple` önek eşleşmesi, ikisi de
 * aksan katlanmış metin üzerinde (sorgu ve belge simetrik); ağırlıklar A/B/C/D; trigram geri dönüşü.
 * Sıralama formülünde ticari sinyal yoktur (AK-04, REQ-ARA-008/009).
 */
@Injectable()
export class PostgresSearchAdapter implements SearchPort {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(d: SearchDocumentInput): Promise<void> {
    const [a, b, c, dd] = [d.text.a, d.text.b, d.text.c, d.text.d].map(fold);
    const tsv = Prisma.sql`
      setweight(to_tsvector('turkish', ${a}), 'A') || setweight(to_tsvector('simple', ${a}), 'A') ||
      setweight(to_tsvector('turkish', ${b}), 'B') || setweight(to_tsvector('simple', ${b}), 'B') ||
      setweight(to_tsvector('turkish', ${c}), 'C') || setweight(to_tsvector('simple', ${c}), 'C') ||
      setweight(to_tsvector('turkish', ${dd}), 'D') || setweight(to_tsvector('simple', ${dd}), 'D')`;
    const geo =
      d.lat !== null && d.lng !== null
        ? Prisma.sql`ST_SetSRID(ST_MakePoint(${d.lng}, ${d.lat}), 4326)::geography`
        : Prisma.sql`NULL`;
    await this.prisma.$executeRaw`
      INSERT INTO search_documents (id, doc_type, ref_id, title, subtitle, path, name_fold, tsv, kind,
        article_type, category_ids, province_id, district_id, price_level, attributes, status,
        data_origin, rating_count, rating_avg, rating_bayes, geo, published_at, indexed_at)
      VALUES (gen_random_uuid(), ${d.docType}::"SearchDocType", ${d.refId}::uuid, ${d.title},
        ${d.subtitle}, ${d.path}, ${fold(d.title)}, ${tsv}, ${d.kind}::"ListingKind",
        ${d.articleType}::"ArticleType", ${d.categoryIds}::uuid[], ${d.provinceId}::uuid,
        ${d.districtId}::uuid, ${d.priceLevel}::smallint, ${JSON.stringify(d.attributes)}::jsonb,
        ${d.status}, ${d.dataOrigin}::"DataOrigin", ${d.ratingCount}, ${d.ratingAvg}::numeric,
        ${d.ratingBayes}::numeric, ${geo}, ${d.publishedAt}, now())
      ON CONFLICT (doc_type, ref_id) DO UPDATE SET
        title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, path = EXCLUDED.path,
        name_fold = EXCLUDED.name_fold, tsv = EXCLUDED.tsv, kind = EXCLUDED.kind,
        article_type = EXCLUDED.article_type, category_ids = EXCLUDED.category_ids,
        province_id = EXCLUDED.province_id, district_id = EXCLUDED.district_id,
        price_level = EXCLUDED.price_level, attributes = EXCLUDED.attributes,
        status = EXCLUDED.status, data_origin = EXCLUDED.data_origin,
        rating_count = EXCLUDED.rating_count, rating_avg = EXCLUDED.rating_avg,
        rating_bayes = EXCLUDED.rating_bayes, geo = EXCLUDED.geo,
        published_at = EXCLUDED.published_at, indexed_at = now()`;
  }

  async delete(docType: SearchDocType, refId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM search_documents WHERE doc_type = ${docType}::"SearchDocType" AND ref_id = ${refId}::uuid`;
  }

  async query(c: SearchCriteria): Promise<{ rows: SearchRow[]; total: number }> {
    const tokens = c.tokens.filter(safeToken);
    const phrase = tokens.join(' ');
    const tsq = tokens.length
      ? Prisma.join(
          tokens.map(
            (t) => Prisma.sql`(to_tsquery('turkish', ${t}) || to_tsquery('simple', ${`${t}:*`}))`,
          ),
          c.matchAny ? ' || ' : ' && ',
        )
      : Prisma.sql`NULL::tsquery`;

    const where: Prisma.Sql[] = [Prisma.sql`d.doc_type = ANY(${c.docTypes}::"SearchDocType"[])`];
    if (tokens.length) {
      where.push(
        c.fuzzy
          ? Prisma.sql`word_similarity(${phrase}, d.name_fold) >= ${FUZZY_THRESHOLD}`
          : Prisma.sql`d.tsv @@ q.tsq`,
      );
    }
    if (c.kind) where.push(Prisma.sql`d.kind = ${c.kind}::"ListingKind"`);
    if (c.categoryId) where.push(Prisma.sql`d.category_ids @> ARRAY[${c.categoryId}::uuid]`);
    if (c.provinceId) where.push(Prisma.sql`d.province_id = ${c.provinceId}::uuid`);
    if (c.districtId) where.push(Prisma.sql`d.district_id = ${c.districtId}::uuid`);
    if (c.priceMax !== null) where.push(Prisma.sql`d.price_level <= ${c.priceMax}`);
    if (c.minRating !== null) {
      where.push(Prisma.sql`d.rating_count >= 3 AND d.rating_avg >= ${c.minRating}`);
    }
    for (const [key, value] of Object.entries(c.attributes)) {
      where.push(Prisma.sql`d.attributes @> ${JSON.stringify({ [key]: value })}::jsonb`);
    }
    if (c.excludeDemo) where.push(Prisma.sql`d.data_origin <> 'DEMO'`);

    const distance = c.near
      ? Prisma.sql`ST_Distance(d.geo, ST_SetSRID(ST_MakePoint(${c.near.lng}, ${c.near.lat}), 4326)::geography) / 1000.0`
      : Prisma.sql`NULL::float8`;
    const textScore = !tokens.length
      ? Prisma.sql`0`
      : c.fuzzy
        ? Prisma.sql`word_similarity(${phrase}, d.name_fold)`
        : Prisma.sql`ts_rank_cd(d.tsv, q.tsq)`;
    // Önerilen = alaka + Bayes puanı + tazelik + mesafe (/nasil-degerlendiriyoruz'da açıklanır).
    const score = Prisma.sql`(${textScore}
      + CASE WHEN d.rating_count >= 3 THEN 0.3 * coalesce(d.rating_bayes, 0) / 5 ELSE 0 END
      + 0.1 * exp(-extract(epoch FROM (now() - coalesce(d.published_at, now()))) / 31536000.0)
      ${c.near ? Prisma.sql`+ 0.3 / (1 + coalesce(${distance}, 1000) / 5)` : Prisma.empty})`;
    const closedLast = Prisma.sql`(d.status IS NOT DISTINCT FROM 'CLOSED_PERMANENTLY')`;
    const order = {
      recommended: Prisma.sql`${closedLast}, score DESC, d.title, d.id`,
      rating: Prisma.sql`${closedLast}, (d.rating_count >= 3) DESC, d.rating_bayes DESC NULLS LAST, score DESC, d.id`,
      reviews: Prisma.sql`${closedLast}, d.rating_count DESC, score DESC, d.id`,
      nearest: Prisma.sql`${closedLast}, distance_km ASC NULLS LAST, score DESC, d.id`,
      newest: Prisma.sql`d.published_at DESC NULLS LAST, d.id`,
    }[c.sort];

    const rows = await this.prisma.$queryRaw<
      Array<{
        doc_type: 'LISTING' | 'ARTICLE';
        ref_id: string;
        title: string;
        subtitle: string | null;
        path: string;
        kind: SearchRow['kind'];
        article_type: SearchRow['articleType'];
        status: string | null;
        price_level: number | null;
        rating_count: number;
        distance_km: number | null;
        data_origin: string;
        total: bigint;
      }>
    >`
      WITH q AS (SELECT ${tsq} AS tsq)
      SELECT d.doc_type, d.ref_id, d.title, d.subtitle, d.path, d.kind, d.article_type, d.status,
        d.price_level, d.rating_count, d.data_origin, ${distance} AS distance_km,
        ${score} AS score, count(*) OVER () AS total
      FROM search_documents d, q
      WHERE ${Prisma.join(where, ' AND ')}
      ORDER BY ${order}
      OFFSET ${c.offset} LIMIT ${c.limit}`;
    let total = rows.length ? Number(rows[0]!.total) : 0;
    if (!rows.length && c.offset > 0) {
      const [n] = await this.prisma.$queryRaw<Array<{ n: bigint }>>`
        WITH q AS (SELECT ${tsq} AS tsq)
        SELECT count(*) AS n FROM search_documents d, q WHERE ${Prisma.join(where, ' AND ')}`;
      total = Number(n?.n ?? 0);
    }
    return {
      total,
      rows: rows.map((r) => ({
        docType: r.doc_type,
        refId: r.ref_id,
        title: r.title,
        subtitle: r.subtitle,
        path: r.path,
        kind: r.kind,
        articleType: r.article_type,
        status: r.status,
        priceLevel: r.price_level,
        ratingCount: r.rating_count,
        distanceKm: r.distance_km === null ? null : Math.round(Number(r.distance_km) * 10) / 10,
        dataOrigin: r.data_origin,
      })),
    };
  }

  async suggest(
    prefixTokens: string[],
    perGroup: number,
    excludeDemo: boolean,
  ): Promise<SuggestRow[]> {
    const phrase = prefixTokens.filter(safeToken).join(' ');
    if (!phrase) return [];
    const like = `%${phrase}%`;
    const rows = await this.prisma.$queryRaw<
      Array<{ doc_type: SearchDocType; title: string; subtitle: string | null; path: string }>
    >`
      SELECT doc_type, title, subtitle, path FROM (
        SELECT d.doc_type, d.title, d.subtitle, d.path,
          row_number() OVER (
            PARTITION BY d.doc_type
            ORDER BY (d.name_fold LIKE ${`${phrase}%`}) DESC, length(d.title), d.title, d.id
          ) AS rn
        FROM search_documents d
        WHERE d.name_fold LIKE ${like}
          AND (d.status IS DISTINCT FROM 'CLOSED_PERMANENTLY')
          ${excludeDemo ? Prisma.sql`AND d.data_origin <> 'DEMO'` : Prisma.empty}
      ) s WHERE rn <= ${perGroup}
      ORDER BY doc_type, rn`;
    return rows.map((r) => ({
      docType: r.doc_type,
      title: r.title,
      subtitle: r.subtitle,
      path: r.path,
    }));
  }
}
