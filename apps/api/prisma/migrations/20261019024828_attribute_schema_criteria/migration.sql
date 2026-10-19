-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('BOOL', 'ENUM', 'MULTI_ENUM', 'INT', 'DECIMAL', 'TEXT', 'DATE');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "attribute_schema_version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "attribute_definitions" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "AttributeType" NOT NULL,
    "options" JSONB NOT NULL DEFAULT '[]',
    "unit" TEXT,
    "filterable" BOOLEAN NOT NULL DEFAULT false,
    "show_on_card" BOOLEAN NOT NULL DEFAULT false,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "validation" JSONB NOT NULL DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "attribute_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_schema_versions" (
    "category_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "definitions" JSONB NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_schema_versions_pkey" PRIMARY KEY ("category_id","version")
);

-- CreateTable
CREATE TABLE "review_criteria" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "review_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attribute_definitions_category_id_key_key" ON "attribute_definitions"("category_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "review_criteria_category_id_key_key" ON "review_criteria"("category_id", "key");

-- AddForeignKey
ALTER TABLE "attribute_definitions" ADD CONSTRAINT "attribute_definitions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_schema_versions" ADD CONSTRAINT "category_schema_versions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_criteria" ADD CONSTRAINT "review_criteria_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- REQ-VER-003: anahtar biçimi ve seçenek dizisi.
ALTER TABLE "attribute_definitions" ADD CONSTRAINT "attribute_definitions_key_format" CHECK ("key" ~ '^[a-z][a-zA-Z0-9]{1,39}$');
ALTER TABLE "attribute_definitions" ADD CONSTRAINT "attribute_definitions_options_array" CHECK (jsonb_typeof("options") = 'array');
ALTER TABLE "attribute_definitions" ADD CONSTRAINT "attribute_definitions_choice_options" CHECK ("type" NOT IN ('ENUM', 'MULTI_ENUM') OR jsonb_array_length("options") >= 2);
-- Şema anlık görüntüleri değiştirilemez (yalnızca INSERT).
CREATE OR REPLACE FUNCTION category_schema_versions_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'category_schema_versions değiştirilemez (REQ-VER-003)';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "category_schema_versions_immutable" BEFORE UPDATE OR DELETE ON "category_schema_versions"
  FOR EACH ROW EXECUTE FUNCTION category_schema_versions_immutable();
