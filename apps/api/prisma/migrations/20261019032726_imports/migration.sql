-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PREVIEW', 'COMMITTED', 'ROLLED_BACK');

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "import_batch_id" UUID;

-- CreateTable
CREATE TABLE "import_batches" (
    "id" UUID NOT NULL,
    "kind" "ListingKind" NOT NULL,
    "primary_category_id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "file_name" TEXT,
    "status" "ImportStatus" NOT NULL DEFAULT 'PREVIEW',
    "mapping" JSONB NOT NULL,
    "rows" JSONB NOT NULL,
    "row_count" INTEGER NOT NULL,
    "valid_count" INTEGER NOT NULL,
    "created_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "committed_at" TIMESTAMPTZ(3),
    "rolled_back_at" TIMESTAMPTZ(3),

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_batches_created_at_idx" ON "import_batches"("created_at");

-- CreateIndex
CREATE INDEX "listings_import_batch_id_idx" ON "listings"("import_batch_id");

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_primary_category_id_fkey" FOREIGN KEY ("primary_category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

