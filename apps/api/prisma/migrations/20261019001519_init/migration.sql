-- Eklentiler (ADR-0004/0005): coğrafi model, trigram arama, aksan katlama.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- CreateEnum
CREATE TYPE "ListingKind" AS ENUM ('PLACE', 'LODGING', 'PRODUCT', 'SERVICE_PROVIDER', 'GUIDE_PERSON', 'EXPERIENCE', 'POI', 'DESTINATION', 'EVENT', 'WORK');

-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('DRAFT', 'HIDDEN', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "DataOrigin" AS ENUM ('DEMO', 'EDITORIAL', 'USER', 'OWNER', 'PROVIDER', 'IMPORT');

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" UUID,
    "allowed_kinds" "ListingKind"[],
    "status" "CategoryStatus" NOT NULL DEFAULT 'DRAFT',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "ymyl" BOOLEAN NOT NULL DEFAULT false,
    "requires_expert_review" BOOLEAN NOT NULL DEFAULT false,
    "ugc_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sponsorship_allowed" BOOLEAN NOT NULL DEFAULT true,
    "requires_license" BOOLEAN NOT NULL DEFAULT false,
    "data_origin" "DataOrigin" NOT NULL DEFAULT 'EDITORIAL',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "actor_role" TEXT,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "summary" JSONB,
    "ip_prefix" TEXT,
    "trace_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_status_sort_order_id_idx" ON "categories"("status", "sort_order", "id");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "audit_log_target_type_target_id_idx" ON "audit_log"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Denetim kaydı değiştirilemez (REQ-VER-017): UPDATE ve DELETE engellenir.
-- Faz 1'de uygulama rolü ayrıca yalnızca INSERT yetkisine sahip olacak (REQ-GUV-011).
CREATE OR REPLACE FUNCTION audit_log_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log değiştirilemez (REQ-VER-017)';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update_delete
  BEFORE UPDATE OR DELETE ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();

CREATE TRIGGER audit_log_no_truncate
  BEFORE TRUNCATE ON "audit_log"
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_immutable();
