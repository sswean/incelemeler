-- CreateEnum
CREATE TYPE "ArticleType" AS ENUM ('GUIDE', 'LIST', 'COMPARISON', 'REVIEW', 'NEWS', 'SPONSORED');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommercialRelation" AS ENUM ('NONE', 'GIFTED', 'SPONSORED', 'AFFILIATE');

-- CreateEnum
CREATE TYPE "ExperienceType" AS ENUM ('TESTED_IN_PERSON', 'VISITED', 'STAYED', 'USED_LONG_TERM', 'RESEARCH_ONLY');

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL,
    "type" "ArticleType" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "body" JSONB NOT NULL DEFAULT '[]',
    "hero_media_id" UUID,
    "sources" JSONB NOT NULL DEFAULT '[]',
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "interest_declared" BOOLEAN NOT NULL DEFAULT false,
    "commercial_relation" "CommercialRelation" NOT NULL DEFAULT 'NONE',
    "experience_type" "ExperienceType",
    "experience_note" TEXT,
    "selection_method" TEXT,
    "author_id" UUID NOT NULL,
    "editor_id" UUID,
    "disclosure_checked_by_id" UUID,
    "scheduled_at" TIMESTAMPTZ(3),
    "published_at" TIMESTAMPTZ(3),
    "last_significant_update_at" TIMESTAMPTZ(3),
    "update_notes" JSONB NOT NULL DEFAULT '[]',
    "corrections" JSONB NOT NULL DEFAULT '[]',
    "data_origin" "DataOrigin" NOT NULL DEFAULT 'EDITORIAL',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_revisions" (
    "id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "actor_id" UUID NOT NULL,
    "change_note" TEXT,
    "significant" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "author_profiles" (
    "user_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "expertise" TEXT[],
    "ethics" TEXT,
    "links" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "author_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_status_type_published_at_idx" ON "articles"("status", "type", "published_at");

-- CreateIndex
CREATE INDEX "articles_author_id_idx" ON "articles"("author_id");

-- CreateIndex
CREATE INDEX "articles_status_scheduled_at_idx" ON "articles"("status", "scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "content_revisions_article_id_version_key" ON "content_revisions"("article_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "author_profiles_slug_key" ON "author_profiles"("slug");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "author_profiles" ADD CONSTRAINT "author_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- REQ-ICR-004/008: sponsorlu ilişki yalnızca sponsorlu içerik türünde; yayımlanan içerikte menfaat beyanı yanıtlı.
ALTER TABLE "articles" ADD CONSTRAINT "articles_sponsored_type" CHECK (("commercial_relation" = 'SPONSORED') = ("type" = 'SPONSORED'));
ALTER TABLE "articles" ADD CONSTRAINT "articles_published_requires_interest" CHECK ("status" <> 'PUBLISHED' OR ("interest_declared" AND "published_at" IS NOT NULL));
ALTER TABLE "articles" ADD CONSTRAINT "articles_scheduled_requires_time" CHECK ("status" <> 'SCHEDULED' OR "scheduled_at" IS NOT NULL);
ALTER TABLE "articles" ADD CONSTRAINT "articles_body_array" CHECK (jsonb_typeof("body") = 'array');
