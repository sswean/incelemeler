-- REQ-VER-009: `geo` üretilen sütun yerine tetikleyiciyle doldurulur. Prisma üretilen sütun ifadesini
-- varsayılan değer gibi görüp sürekli fark üretiyordu; düz sütun + tetikleyici şemada `Unsupported` +
-- GiST indeksiyle birebir ifade edilir (LESSONS).
ALTER TABLE "listing_locations" DROP COLUMN IF EXISTS "geo";
ALTER TABLE "listing_locations" ADD COLUMN "geo" geography(Point, 4326);

CREATE OR REPLACE FUNCTION listing_locations_set_geo() RETURNS trigger AS $$
BEGIN
  NEW."geo" := CASE WHEN NEW."latitude" IS NOT NULL AND NEW."longitude" IS NOT NULL
    THEN ST_SetSRID(ST_MakePoint(NEW."longitude"::float8, NEW."latitude"::float8), 4326)::geography END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "listing_locations_geo" BEFORE INSERT OR UPDATE ON "listing_locations"
  FOR EACH ROW EXECUTE FUNCTION listing_locations_set_geo();
CREATE INDEX "listing_locations_geo_idx" ON "listing_locations" USING GIST ("geo");
