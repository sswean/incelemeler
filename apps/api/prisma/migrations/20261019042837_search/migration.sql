-- CreateEnum
CREATE TYPE "SearchDocType" AS ENUM ('LISTING', 'ARTICLE', 'CATEGORY', 'PLACE');

-- CreateTable
CREATE TABLE "search_documents" (
    "id" UUID NOT NULL,
    "doc_type" "SearchDocType" NOT NULL,
    "ref_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "path" TEXT NOT NULL,
    "name_fold" TEXT NOT NULL,
    "tsv" tsvector NOT NULL,
    "kind" "ListingKind",
    "article_type" "ArticleType",
    "category_ids" UUID[],
    "province_id" UUID,
    "district_id" UUID,
    "price_level" SMALLINT,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT,
    "data_origin" "DataOrigin" NOT NULL,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "rating_avg" DECIMAL(3,2),
    "rating_bayes" DECIMAL(5,3),
    "geo" geography(Point,4326),
    "published_at" TIMESTAMPTZ(3),
    "indexed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_aliases" (
    "id" UUID NOT NULL,
    "alias" TEXT NOT NULL,
    "alias_fold" TEXT NOT NULL,
    "admin_area_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_synonyms" (
    "id" UUID NOT NULL,
    "term" TEXT NOT NULL,
    "replacement" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "search_synonyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_intents" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "terms" TEXT[],
    "filter" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "search_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_events" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "query_norm" TEXT NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "result_count" INTEGER NOT NULL,
    "session_hash" TEXT,

    CONSTRAINT "search_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_documents_tsv_idx" ON "search_documents" USING GIN ("tsv");

-- CreateIndex
CREATE INDEX "search_documents_name_fold_idx" ON "search_documents" USING GIN ("name_fold" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "search_documents_category_ids_idx" ON "search_documents" USING GIN ("category_ids");

-- CreateIndex
CREATE INDEX "search_documents_province_id_district_id_idx" ON "search_documents"("province_id", "district_id");

-- CreateIndex
CREATE INDEX "search_documents_geo_idx" ON "search_documents" USING GIST ("geo");

-- CreateIndex
CREATE UNIQUE INDEX "search_documents_doc_type_ref_id_key" ON "search_documents"("doc_type", "ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "place_aliases_alias_fold_key" ON "place_aliases"("alias_fold");

-- CreateIndex
CREATE UNIQUE INDEX "search_synonyms_term_key" ON "search_synonyms"("term");

-- CreateIndex
CREATE UNIQUE INDEX "search_intents_key_key" ON "search_intents"("key");

-- CreateIndex
CREATE INDEX "search_events_created_at_idx" ON "search_events"("created_at");

-- CreateIndex
CREATE INDEX "search_events_query_norm_idx" ON "search_events"("query_norm");

-- AddForeignKey
ALTER TABLE "place_aliases" ADD CONSTRAINT "place_aliases_admin_area_id_fkey" FOREIGN KEY ("admin_area_id") REFERENCES "admin_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ── Türkçe normalizasyon (REQ-ARA-003): @incelemeler/utils normalizeTr ile birebir aynı kurallar ──
-- Parite search.int testinde doğrulanır. Veritabanı UTF-8 ctype ile oluşturulmalıdır (ADR-0012).
CREATE OR REPLACE FUNCTION tr_lower(s text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT lower(translate(normalize(s, NFC), 'Iİ', 'ıi')) $$;

-- (1) Türkçe küçük harf, (2) kesme işaretinden sonraki eki at, noktalama → boşluk.
CREATE OR REPLACE FUNCTION normalize_tr(s text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$
    SELECT btrim(regexp_replace(
      regexp_replace(tr_lower(s), '[''’‘`´]\S*', '', 'g'),
      '[^[:alnum:]]+', ' ', 'g'))
  $$;

-- (3) Aksan katlanmış varyant; unaccent IMMUTABLE sarmalayıcıyla (sözlük açıkça belirtilir).
CREATE OR REPLACE FUNCTION fold_tr(s text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, translate(normalize_tr(s), 'çğıöşüâîû', 'cgiosuaiu')) $$;
