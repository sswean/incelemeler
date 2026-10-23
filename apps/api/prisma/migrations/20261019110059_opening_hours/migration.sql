-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "hours_verified_at" TIMESTAMPTZ(3),
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul';

-- CreateTable
CREATE TABLE "listing_opening_hours" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "weekday" SMALLINT NOT NULL,
    "opens_min" SMALLINT NOT NULL,
    "closes_min" SMALLINT NOT NULL,

    CONSTRAINT "listing_opening_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_opening_exceptions" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "closed" BOOLEAN NOT NULL,
    "opens_min" SMALLINT,
    "closes_min" SMALLINT,
    "note" TEXT,

    CONSTRAINT "listing_opening_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_opening_hours_listing_id_weekday_idx" ON "listing_opening_hours"("listing_id", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "listing_opening_exceptions_listing_id_date_key" ON "listing_opening_exceptions"("listing_id", "date");

-- AddForeignKey
ALTER TABLE "listing_opening_hours" ADD CONSTRAINT "listing_opening_hours_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_opening_exceptions" ADD CONSTRAINT "listing_opening_exceptions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ISO gün 1–7; dakika 0–1440; açılış ve kapanış eşit olamaz (REQ-VER-010).
ALTER TABLE "listing_opening_hours" ADD CONSTRAINT "listing_opening_hours_range_ck"
  CHECK ("weekday" BETWEEN 1 AND 7 AND "opens_min" BETWEEN 0 AND 1439
         AND "closes_min" BETWEEN 1 AND 1440 AND "opens_min" <> "closes_min");
ALTER TABLE "listing_opening_exceptions" ADD CONSTRAINT "listing_opening_exceptions_range_ck"
  CHECK (("closed" AND "opens_min" IS NULL AND "closes_min" IS NULL)
         OR (NOT "closed" AND "opens_min" BETWEEN 0 AND 1439 AND "closes_min" BETWEEN 1 AND 1440
             AND "opens_min" <> "closes_min"));
-- Saat dilimi geçerli bir IANA adı olmalı (now() AT TIME ZONE ile denetlenir).
CREATE OR REPLACE FUNCTION listings_timezone_valid(tz text) RETURNS boolean AS $$
BEGIN
  PERFORM now() AT TIME ZONE tz;
  RETURN true;
EXCEPTION WHEN others THEN
  RETURN false;
END $$ LANGUAGE plpgsql IMMUTABLE;
ALTER TABLE "listings" ADD CONSTRAINT "listings_timezone_ck" CHECK (listings_timezone_valid("timezone"));
