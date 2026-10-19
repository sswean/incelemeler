-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('LINK_ONLY', 'SANDBOX', 'LIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "OutboundKind" AS ENUM ('AFFILIATE', 'BOOKING', 'PURCHASE', 'WEBSITE', 'PHONE', 'MESSAGING', 'MAP', 'QUOTE_REQUEST');

-- CreateEnum
CREATE TYPE "OutboundStatus" AS ENUM ('ACTIVE', 'DISABLED', 'BROKEN', 'EXPIRED');

-- CreateTable
CREATE TABLE "integration_providers" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "integration_status" "IntegrationStatus" NOT NULL DEFAULT 'LINK_ONLY',
    "docs_url" TEXT,
    "terms_url" TEXT,
    "terms_verified_at" TIMESTAMPTZ(3),
    "allowed_domains" TEXT[],
    "cache_ttl_seconds" INTEGER,
    "credential_env_names" TEXT[],
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "integration_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbound_links" (
    "id" UUID NOT NULL,
    "listing_id" UUID,
    "provider_id" UUID,
    "kind" "OutboundKind" NOT NULL,
    "cta_type" TEXT NOT NULL,
    "label" TEXT,
    "url_template" TEXT NOT NULL,
    "allowed_domain" TEXT,
    "commercial_relation" "CommercialRelation" NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "valid_from" TIMESTAMPTZ(3),
    "valid_until" TIMESTAMPTZ(3),
    "status" "OutboundStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_checked_at" TIMESTAMPTZ(3),
    "last_check_status" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "outbound_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbound_clicks" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "link_id" UUID NOT NULL,
    "surface" TEXT NOT NULL,
    "page_type" TEXT NOT NULL,
    "placement_id" TEXT,
    "session_hash" TEXT NOT NULL,
    "bot" BOOLEAN NOT NULL,
    "prefetch" BOOLEAN NOT NULL,
    "counted" BOOLEAN NOT NULL,

    CONSTRAINT "outbound_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_providers_key_key" ON "integration_providers"("key");

-- CreateIndex
CREATE INDEX "outbound_links_listing_id_status_idx" ON "outbound_links"("listing_id", "status");

-- CreateIndex
CREATE INDEX "outbound_links_status_last_checked_at_idx" ON "outbound_links"("status", "last_checked_at");

-- CreateIndex
CREATE INDEX "outbound_clicks_link_id_created_at_idx" ON "outbound_clicks"("link_id", "created_at");

-- CreateIndex
CREATE INDEX "outbound_clicks_session_hash_link_id_created_at_idx" ON "outbound_clicks"("session_hash", "link_id", "created_at");

-- AddForeignKey
ALTER TABLE "outbound_links" ADD CONSTRAINT "outbound_links_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_links" ADD CONSTRAINT "outbound_links_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "integration_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_links" ADD CONSTRAINT "outbound_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_clicks" ADD CONSTRAINT "outbound_clicks_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "outbound_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ── Ham SQL kısıtları ──
-- Ticari bağlantı türleri bir sağlayıcıya bağlıdır ve ticari ilişki beyanı taşır (A8.2, REQ-AFF-001).
ALTER TABLE "outbound_links" ADD CONSTRAINT "outbound_links_commercial_provider"
  CHECK ("kind" NOT IN ('AFFILIATE', 'BOOKING', 'PURCHASE') OR "provider_id" IS NOT NULL);
ALTER TABLE "outbound_links" ADD CONSTRAINT "outbound_links_affiliate_relation"
  CHECK ("kind" <> 'AFFILIATE' OR "commercial_relation" = 'AFFILIATE');
ALTER TABLE "outbound_links" ADD CONSTRAINT "outbound_links_domain_source"
  CHECK ("provider_id" IS NOT NULL OR "allowed_domain" IS NOT NULL);
ALTER TABLE "outbound_links" ADD CONSTRAINT "outbound_links_validity"
  CHECK ("valid_until" IS NULL OR "valid_from" IS NULL OR "valid_until" > "valid_from");
