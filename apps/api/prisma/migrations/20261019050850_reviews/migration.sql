-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED', 'REMOVED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ReviewVerification" AS ENUM ('SELF_DECLARED', 'DOCUMENTED', 'PROVIDER_VERIFIED');

-- CreateEnum
CREATE TYPE "ModerationMode" AS ENUM ('PRE', 'POST');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'UPHELD', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('OPEN', 'UPHELD', 'OVERTURNED');

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "criteria_ratings" JSONB NOT NULL DEFAULT '[]',
    "experience_month" TEXT,
    "usage_duration" TEXT,
    "visit_context" TEXT,
    "verification" "ReviewVerification" NOT NULL DEFAULT 'SELF_DECLARED',
    "incentivized" BOOLEAN NOT NULL,
    "declared_at" TIMESTAMPTZ(3) NOT NULL,
    "status" "ReviewStatus" NOT NULL,
    "moderation_mode" "ModerationMode" NOT NULL,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "signals" JSONB NOT NULL DEFAULT '[]',
    "reviewed_at" TIMESTAMPTZ(3),
    "reason_code" TEXT,
    "reason_note" TEXT,
    "moderated_by" UUID,
    "moderated_at" TIMESTAMPTZ(3),
    "language" TEXT NOT NULL DEFAULT 'tr',
    "data_origin" "DataOrigin" NOT NULL DEFAULT 'USER',
    "ip_prefix" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(3),
    "edited_at" TIMESTAMPTZ(3),
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_revisions" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "criteria_ratings" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_drafts" (
    "user_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "review_drafts_pkey" PRIMARY KEY ("user_id","listing_id")
);

-- CreateTable
CREATE TABLE "listing_rating_stats" (
    "listing_id" UUID NOT NULL,
    "count" INTEGER NOT NULL,
    "sum" INTEGER NOT NULL,
    "average" DECIMAL(3,2),
    "distribution" JSONB NOT NULL,
    "criteria" JSONB NOT NULL DEFAULT '[]',
    "last12_count" INTEGER NOT NULL,
    "last12_avg" DECIMAL(3,2),
    "bayes" DECIMAL(5,3) NOT NULL,
    "prior" DECIMAL(4,3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "listing_rating_stats_pkey" PRIMARY KEY ("listing_id")
);

-- CreateTable
CREATE TABLE "content_reports" (
    "id" UUID NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "reporter_id" UUID,
    "reporter_email" TEXT,
    "ip_prefix" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "decided_by" UUID,
    "decided_at" TIMESTAMPTZ(3),
    "reason_code" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_appeals" (
    "id" UUID NOT NULL,
    "review_id" UUID,
    "report_id" UUID,
    "appellant_id" UUID NOT NULL,
    "statement" TEXT NOT NULL,
    "original_decider_id" UUID NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'OPEN',
    "decided_by" UUID,
    "decided_at" TIMESTAMPTZ(3),
    "note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_appeals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_listing_id_status_published_at_idx" ON "reviews"("listing_id", "status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "reviews_user_id_created_at_idx" ON "reviews"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "reviews_status_submitted_at_idx" ON "reviews"("status", "submitted_at");

-- CreateIndex
CREATE INDEX "review_revisions_review_id_created_at_idx" ON "review_revisions"("review_id", "created_at");

-- CreateIndex
CREATE INDEX "content_reports_status_created_at_idx" ON "content_reports"("status", "created_at");

-- CreateIndex
CREATE INDEX "content_reports_target_type_target_id_idx" ON "content_reports"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "moderation_appeals_status_created_at_idx" ON "moderation_appeals"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "moderation_appeals_review_id_appellant_id_key" ON "moderation_appeals"("review_id", "appellant_id");

-- CreateIndex
CREATE UNIQUE INDEX "moderation_appeals_report_id_appellant_id_key" ON "moderation_appeals"("report_id", "appellant_id");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_moderated_by_fkey" FOREIGN KEY ("moderated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_revisions" ADD CONSTRAINT "review_revisions_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_drafts" ADD CONSTRAINT "review_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_drafts" ADD CONSTRAINT "review_drafts_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_rating_stats" ADD CONSTRAINT "listing_rating_stats_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "content_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_appellant_id_fkey" FOREIGN KEY ("appellant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ── Ham SQL kısıtları (REQ-VER-006) ──
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5);
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_body_length" CHECK (char_length("body") BETWEEN 50 AND 5000);
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_title_length" CHECK ("title" IS NULL OR char_length("title") <= 100);
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_experience_month_format" CHECK ("experience_month" IS NULL OR "experience_month" ~ '^\d{4}-(0[1-9]|1[0-2])$');
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_published_at_required" CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL);
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_criteria_array" CHECK (jsonb_typeof("criteria_ratings") = 'array');
-- Üye başına listeleme başına 1 aktif değerlendirme (kısmi benzersiz indeks; Prisma şemasında ifade edilemez).
CREATE UNIQUE INDEX "reviews_one_active_per_user" ON "reviews" ("listing_id", "user_id") WHERE "status" NOT IN ('REMOVED', 'WITHDRAWN');
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_one_target" CHECK (("review_id" IS NULL) <> ("report_id" IS NULL));
ALTER TABLE "listing_rating_stats" ADD CONSTRAINT "listing_rating_stats_counts" CHECK ("count" >= 0 AND "last12_count" >= 0);
