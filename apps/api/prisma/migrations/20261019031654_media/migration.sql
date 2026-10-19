-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('READY', 'REJECTED');

-- CreateEnum
CREATE TYPE "MediaSourceType" AS ENUM ('EDITOR', 'OWNER', 'USER', 'STOCK');

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "focal_x" DECIMAL(4,3) NOT NULL DEFAULT 0.5,
    "focal_y" DECIMAL(4,3) NOT NULL DEFAULT 0.5,
    "blurhash" TEXT,
    "alt_text" TEXT,
    "status" "MediaStatus" NOT NULL DEFAULT 'READY',
    "exif_stripped" BOOLEAN NOT NULL DEFAULT false,
    "sha256" TEXT NOT NULL,
    "source_type" "MediaSourceType",
    "rights_holder" TEXT,
    "license_type" TEXT,
    "permission_ref" TEXT,
    "license_expires_at" TIMESTAMPTZ(3),
    "model_property_release" BOOLEAN,
    "uploaded_by_id" UUID NOT NULL,
    "data_origin" "DataOrigin" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_usages" (
    "id" UUID NOT NULL,
    "media_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_storage_key_key" ON "media_assets"("storage_key");

-- CreateIndex
CREATE INDEX "media_assets_uploaded_by_id_idx" ON "media_assets"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "media_usages_entity_type_entity_id_sort_order_idx" ON "media_usages"("entity_type", "entity_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "media_usages_media_id_entity_type_entity_id_key" ON "media_usages"("media_id", "entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_usages" ADD CONSTRAINT "media_usages_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- REQ-VER-014: odak noktası 0–1, pozitif boyutlar; kullanım rolü sabit küme.
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_focal_range" CHECK ("focal_x" BETWEEN 0 AND 1 AND "focal_y" BETWEEN 0 AND 1);
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_dimensions" CHECK ("width" > 0 AND "height" > 0 AND "bytes" > 0);
ALTER TABLE "media_usages" ADD CONSTRAINT "media_usages_role" CHECK ("role" IN ('PRIMARY', 'GALLERY'));
-- Bir varlığın en fazla bir kapak görseli olur.
CREATE UNIQUE INDEX "media_usages_one_primary" ON "media_usages"("entity_type", "entity_id") WHERE "role" = 'PRIMARY';
