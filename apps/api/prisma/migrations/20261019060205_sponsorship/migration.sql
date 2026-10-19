-- CreateEnum
CREATE TYPE "PlacementSurface" AS ENUM ('SEARCH', 'CATEGORY_LIST', 'LISTING_DETAIL', 'HOME');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'LIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CreativeApproval" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SponsoredEventType" AS ENUM ('SERVED', 'VIEWED', 'CLICK');

-- CreateTable
CREATE TABLE "placement_slots" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "surface" "PlacementSurface" NOT NULL,
    "name" TEXT NOT NULL,
    "positions" INTEGER[],
    "max_items" INTEGER NOT NULL,
    "allowed_kinds" "ListingKind"[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "placement_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sponsor_id" UUID NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "budget_kurus" BIGINT,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "contract_ref" TEXT,
    "sales_approved_by" UUID,
    "sales_approved_at" TIMESTAMPTZ(3),
    "editorial_approved_by" UUID,
    "editorial_approved_at" TIMESTAMPTZ(3),
    "data_origin" "DataOrigin" NOT NULL DEFAULT 'EDITORIAL',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_placements" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "slot_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "target_category_id" UUID,
    "target_area_id" UUID,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creatives" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "label_type" "CommercialRelation" NOT NULL DEFAULT 'SPONSORED',
    "approval" "CreativeApproval" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "creatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsored_events" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "placement_id" UUID NOT NULL,
    "type" "SponsoredEventType" NOT NULL,
    "surface" "PlacementSurface" NOT NULL,
    "session_hash" TEXT,
    "bot" BOOLEAN NOT NULL DEFAULT false,
    "prefetch" BOOLEAN NOT NULL DEFAULT false,
    "demo" BOOLEAN NOT NULL DEFAULT false,
    "counted" BOOLEAN NOT NULL,

    CONSTRAINT "sponsored_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_removal_requests" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "report_id" UUID,
    "requested_by" UUID NOT NULL,
    "reason_code" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decided_by" UUID,
    "decided_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_removal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "placement_slots_key_key" ON "placement_slots"("key");

-- CreateIndex
CREATE INDEX "campaigns_status_starts_at_ends_at_idx" ON "campaigns"("status", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "campaign_placements_slot_id_idx" ON "campaign_placements"("slot_id");

-- CreateIndex
CREATE INDEX "campaign_placements_listing_id_idx" ON "campaign_placements"("listing_id");

-- CreateIndex
CREATE INDEX "sponsored_events_placement_id_type_created_at_idx" ON "sponsored_events"("placement_id", "type", "created_at");

-- CreateIndex
CREATE INDEX "sponsored_events_session_hash_placement_id_type_created_at_idx" ON "sponsored_events"("session_hash", "placement_id", "type", "created_at");

-- CreateIndex
CREATE INDEX "review_removal_requests_status_created_at_idx" ON "review_removal_requests"("status", "created_at");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_sponsor_id_fkey" FOREIGN KEY ("sponsor_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_placements" ADD CONSTRAINT "campaign_placements_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_placements" ADD CONSTRAINT "campaign_placements_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "placement_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_placements" ADD CONSTRAINT "campaign_placements_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creatives" ADD CONSTRAINT "creatives_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsored_events" ADD CONSTRAINT "sponsored_events_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "campaign_placements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_removal_requests" ADD CONSTRAINT "review_removal_requests_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- A8.3 üst sınırları veritabanında da (panel ve API'ye ek savunma — REQ-SPN-004).
ALTER TABLE "placement_slots" ADD CONSTRAINT "placement_slots_cap" CHECK (
  "max_items" >= 0 AND "max_items" <= CASE "surface"
    WHEN 'SEARCH' THEN 2 WHEN 'CATEGORY_LIST' THEN 2 WHEN 'LISTING_DETAIL' THEN 1 WHEN 'HOME' THEN 2 END
  AND cardinality("positions") >= "max_items"
);
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_window" CHECK ("ends_at" > "starts_at");
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_budget" CHECK ("budget_kurus" IS NULL OR "budget_kurus" >= 0);
ALTER TABLE "campaign_placements" ADD CONSTRAINT "campaign_placements_weight" CHECK ("weight" BETWEEN 1 AND 100 AND "priority" BETWEEN 0 AND 10);
ALTER TABLE "sponsored_events" ADD CONSTRAINT "sponsored_events_counted" CHECK (NOT "counted" OR (NOT "bot" AND NOT "prefetch" AND NOT "demo"));
ALTER TABLE "review_removal_requests" ADD CONSTRAINT "review_removal_requests_status" CHECK ("status" IN ('PENDING', 'CONFIRMED', 'DECLINED'));
CREATE UNIQUE INDEX "review_removal_requests_one_pending" ON "review_removal_requests" ("review_id") WHERE "status" = 'PENDING';

-- Yuva kataloğu: render noktaları kodda sabit (REQ-SPN-001); varsayılan pozisyonlar A8.3.
INSERT INTO "placement_slots" ("id", "key", "surface", "name", "positions", "max_items", "allowed_kinds", "updated_at") VALUES
  (gen_random_uuid(), 'search-results', 'SEARCH', 'Arama sonuçları', '{3,13}', 2, '{}', now()),
  (gen_random_uuid(), 'category-list', 'CATEGORY_LIST', 'Kategori ve keşif listeleri', '{3,8}', 2, '{}', now()),
  (gen_random_uuid(), 'listing-detail-competitor', 'LISTING_DETAIL', 'Listeleme detayı · rakip kutu', '{1}', 1, '{}', now()),
  (gen_random_uuid(), 'home-modules', 'HOME', 'Ana sayfa modülleri', '{2,4}', 2, '{}', now())
ON CONFLICT ("key") DO NOTHING;
