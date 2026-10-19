-- CreateEnum
CREATE TYPE "SanctionLevel" AS ENUM ('WARNING', 'REVIEW_RESTRICTION', 'SUSPENSION', 'PERMANENT_BAN');

-- CreateTable
CREATE TABLE "account_sanctions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "level" "SanctionLevel" NOT NULL,
    "reason_code" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "skipped_level" BOOLEAN NOT NULL DEFAULT false,
    "starts_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMPTZ(3),
    "issued_by" UUID NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "revoked_by" UUID,
    "revoke_reason" TEXT,
    "appeal_statement" TEXT,
    "appealed_at" TIMESTAMPTZ(3),
    "appeal_outcome" TEXT,
    "appeal_decided_by" UUID,
    "appeal_decided_at" TIMESTAMPTZ(3),
    "appeal_note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "account_sanctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_integrity_notices" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "detected_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removed_count" INTEGER NOT NULL,
    "note" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_integrity_notices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_sanctions_user_id_revoked_at_idx" ON "account_sanctions"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "account_sanctions_appealed_at_appeal_outcome_idx" ON "account_sanctions"("appealed_at", "appeal_outcome");

-- CreateIndex
CREATE INDEX "listing_integrity_notices_listing_id_detected_at_idx" ON "listing_integrity_notices"("listing_id", "detected_at" DESC);

-- AddForeignKey
ALTER TABLE "account_sanctions" ADD CONSTRAINT "account_sanctions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_sanctions" ADD CONSTRAINT "account_sanctions_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_integrity_notices" ADD CONSTRAINT "listing_integrity_notices_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Süreli basamaklar bitiş tarihi taşır, diğerleri taşımaz; itirazı yaptırımı veren moderatör karara bağlayamaz.
ALTER TABLE "account_sanctions" ADD CONSTRAINT "account_sanctions_duration_ck"
  CHECK (("level" IN ('REVIEW_RESTRICTION', 'SUSPENSION')) = ("ends_at" IS NOT NULL));
ALTER TABLE "account_sanctions" ADD CONSTRAINT "account_sanctions_appeal_decider_ck"
  CHECK ("appeal_decided_by" IS NULL OR "appeal_decided_by" <> "issued_by");
ALTER TABLE "account_sanctions" ADD CONSTRAINT "account_sanctions_appeal_outcome_ck"
  CHECK ("appeal_outcome" IS NULL OR ("appeal_outcome" IN ('UPHELD', 'OVERTURNED') AND "appealed_at" IS NOT NULL));
ALTER TABLE "listing_integrity_notices" ADD CONSTRAINT "listing_integrity_notices_count_ck"
  CHECK ("removed_count" > 0);
