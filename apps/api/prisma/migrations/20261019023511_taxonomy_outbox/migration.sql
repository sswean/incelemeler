-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "first_published_at" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "available_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "processed_at" TIMESTAMPTZ(3),
    "dead_at" TIMESTAMPTZ(3),

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outbox_events_aggregate_type_aggregate_id_idx" ON "outbox_events"("aggregate_type", "aggregate_id");

-- Bekleyen olaylar için kısmi dizin (worker sorgusu: processed_at IS NULL AND dead_at IS NULL ORDER BY available_at).
CREATE INDEX "outbox_events_pending_idx" ON "outbox_events"("available_at") WHERE "processed_at" IS NULL AND "dead_at" IS NULL;
-- REQ-MIM-015: işlenmiş ve ölü mektup durumları birbirini dışlar.
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_final_state" CHECK ("processed_at" IS NULL OR "dead_at" IS NULL);
-- REQ-KAT-003: yayımlanmış kategori ilk yayın zamanını taşır.
UPDATE "categories" SET "first_published_at" = "created_at" WHERE "status" = 'PUBLISHED' AND "first_published_at" IS NULL;
ALTER TABLE "categories" ADD CONSTRAINT "categories_published_has_first_published_at" CHECK ("status" <> 'PUBLISHED' OR "first_published_at" IS NOT NULL);
