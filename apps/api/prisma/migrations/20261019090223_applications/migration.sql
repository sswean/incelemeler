-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('BUSINESS', 'ADVERTISING');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "type" "ApplicationType" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "name" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact_role" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "payload" JSONB NOT NULL,
    "privacy_notice_version" TEXT NOT NULL,
    "marketing_consent_at" TIMESTAMPTZ(3),
    "email_verified_at" TIMESTAMPTZ(3),
    "decided_at" TIMESTAMPTZ(3),
    "decided_by" UUID,
    "rejection_reason" TEXT,
    "decision_note" TEXT,
    "listing_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "applications_type_status_created_at_idx" ON "applications"("type", "status", "created_at");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Ticari ileti izni yalnızca reklam başvurusunda; listeleme taslağı yalnızca işletme başvurusunda (REQ-ISL-001/002).
ALTER TABLE "applications" ADD CONSTRAINT "applications_marketing_consent_ck"
  CHECK ("marketing_consent_at" IS NULL OR "type" = 'ADVERTISING');
ALTER TABLE "applications" ADD CONSTRAINT "applications_listing_ck"
  CHECK ("listing_id" IS NULL OR "type" = 'BUSINESS');
-- Karar verilmiş başvuru doğrulanmış olmalı; ret gerekçeli.
ALTER TABLE "applications" ADD CONSTRAINT "applications_decision_ck"
  CHECK (
    ("status" IN ('UNVERIFIED', 'PENDING') AND "decided_at" IS NULL)
    OR ("status" IN ('APPROVED', 'REJECTED') AND "decided_at" IS NOT NULL AND "email_verified_at" IS NOT NULL)
  );
ALTER TABLE "applications" ADD CONSTRAINT "applications_rejection_ck"
  CHECK ("status" <> 'REJECTED' OR "rejection_reason" IS NOT NULL);
