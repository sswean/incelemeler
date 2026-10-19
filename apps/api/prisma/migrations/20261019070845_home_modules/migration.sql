-- CreateEnum
CREATE TYPE "HomeModuleType" AS ENUM ('CATEGORY_SHORTCUTS', 'CITY_PICKER', 'EDITORS_PICKS', 'CATEGORY_POPULAR', 'SEASONAL', 'NEW_ARTICLES', 'COMPARISONS', 'SPONSORED', 'TRUST_LINKS');

-- CreateTable
CREATE TABLE "home_modules" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "type" "HomeModuleType" NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "min_items" INTEGER NOT NULL DEFAULT 4,
    "max_items" INTEGER NOT NULL DEFAULT 8,
    "config" JSONB NOT NULL DEFAULT '{}',
    "visible_from" TIMESTAMPTZ(3),
    "visible_until" TIMESTAMPTZ(3),
    "province_slug" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "home_modules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "home_modules_key_key" ON "home_modules"("key");

-- CreateIndex
CREATE INDEX "home_modules_enabled_position_idx" ON "home_modules"("enabled", "position");


ALTER TABLE "home_modules" ADD CONSTRAINT "home_modules_source" CHECK ("source" IN ('EDITORIAL', 'RULE', 'SPONSORED'));
-- "Editörün seçtikleri" sponsorlu öğe içeremez; sponsorlu kaynak yalnızca sponsorlu modülde (A8.3).
ALTER TABLE "home_modules" ADD CONSTRAINT "home_modules_sponsored_source" CHECK (("type" = 'SPONSORED') = ("source" = 'SPONSORED'));
ALTER TABLE "home_modules" ADD CONSTRAINT "home_modules_items" CHECK ("min_items" >= 0 AND "max_items" >= "min_items" AND "max_items" <= 24);
ALTER TABLE "home_modules" ADD CONSTRAINT "home_modules_window" CHECK ("visible_until" IS NULL OR "visible_from" IS NULL OR "visible_until" > "visible_from");

-- Varsayılan mobil sıra (A15.4). Bülten modülü yok: e-posta pazarlama sağlayıcısı ve ticari ileti izni yok (AK-06).
INSERT INTO "home_modules" ("id", "key", "type", "title", "source", "position", "min_items", "max_items", "config", "updated_at") VALUES
  (gen_random_uuid(), 'kategori-kisayollari', 'CATEGORY_SHORTCUTS', 'Ne keşfetmek istiyorsun?', 'RULE', 10, 4, 12, '{}', now()),
  (gen_random_uuid(), 'sehrini-sec', 'CITY_PICKER', 'Şehrini seç', 'RULE', 20, 1, 12, '{}', now()),
  (gen_random_uuid(), 'editorun-sectikleri', 'EDITORS_PICKS', 'Editörün seçtikleri', 'EDITORIAL', 30, 4, 8, '{"listingSlugs": [], "articleSlugs": []}', now()),
  (gen_random_uuid(), 'sehirde-populer-yeme-icme', 'CATEGORY_POPULAR', 'Öne çıkan restoranlar ve kafeler', 'RULE', 40, 4, 8, '{"categorySlug": "yeme-icme"}', now()),
  (gen_random_uuid(), 'populer-konaklama', 'CATEGORY_POPULAR', 'Popüler oteller ve tatil bölgeleri', 'RULE', 50, 4, 8, '{"categorySlug": "konaklama"}', now()),
  (gen_random_uuid(), 'sezonluk-seckiler', 'SEASONAL', 'Sezonluk öneriler', 'RULE', 60, 4, 8, '{"categorySlug": "turlar-ve-aktiviteler"}', now()),
  (gen_random_uuid(), 'yeni-rehberler', 'NEW_ARTICLES', 'Yeni yayınlanan rehberler', 'RULE', 70, 4, 8, '{}', now()),
  (gen_random_uuid(), 'sponsorlu', 'SPONSORED', 'Sponsorlu öneriler', 'SPONSORED', 80, 1, 2, '{}', now()),
  (gen_random_uuid(), 'karsilastirmalar', 'COMPARISONS', 'Karşılaştırma rehberleri', 'RULE', 90, 4, 8, '{}', now()),
  (gen_random_uuid(), 'guven-ve-seffaflik', 'TRUST_LINKS', 'Güven ve şeffaflık', 'RULE', 100, 0, 6, '{}', now())
ON CONFLICT ("key") DO NOTHING;
