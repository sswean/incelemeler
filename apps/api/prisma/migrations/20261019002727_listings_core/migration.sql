-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('BUSINESS', 'BRAND', 'CHAIN', 'OPERATOR', 'ADVERTISER');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY', 'ARCHIVED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data_origin" "DataOrigin" NOT NULL DEFAULT 'EDITORIAL',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" UUID NOT NULL,
    "kind" "ListingKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_description" TEXT,
    "description" JSONB,
    "primary_category_id" UUID NOT NULL,
    "organization_id" UUID,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "price_level" SMALLINT,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "attribute_schema_version" INTEGER NOT NULL DEFAULT 1,
    "data_origin" "DataOrigin" NOT NULL,
    "source" TEXT NOT NULL,
    "source_verified_at" TIMESTAMPTZ(3),
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "listings_slug_key" ON "listings"("slug");

-- CreateIndex
CREATE INDEX "listings_kind_status_primary_category_id_idx" ON "listings"("kind", "status", "primary_category_id");

-- CreateIndex
CREATE INDEX "listings_organization_id_idx" ON "listings"("organization_id");

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_primary_category_id_fkey" FOREIGN KEY ("primary_category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- REQ-VER-011: fiyat seviyesi göreli 1–4.
ALTER TABLE "listings" ADD CONSTRAINT "listings_price_level_range" CHECK ("price_level" IS NULL OR "price_level" BETWEEN 1 AND 4);
-- REQ-LST-001: yayımlanan listelemenin yayın tarihi olmalıdır.
ALTER TABLE "listings" ADD CONSTRAINT "listings_published_at_required" CHECK ("status" <> 'PUBLISHED' OR "published_at" IS NOT NULL);
