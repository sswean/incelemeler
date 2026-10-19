/*
  Warnings:

  - You are about to drop the column `geo` on the `listing_locations` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "listing_locations_geo_idx";

-- AlterTable
ALTER TABLE "listing_locations" DROP COLUMN "geo";
