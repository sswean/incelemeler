-- CreateEnum
CREATE TYPE "AdminAreaLevel" AS ENUM ('PROVINCE', 'DISTRICT');

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "contacts" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "admin_areas" (
    "id" UUID NOT NULL,
    "level" "AdminAreaLevel" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "code" TEXT,
    "parent_id" UUID,

    CONSTRAINT "admin_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_categories" (
    "listing_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,

    CONSTRAINT "listing_categories_pkey" PRIMARY KEY ("listing_id","category_id")
);

-- CreateTable
CREATE TABLE "listing_locations" (
    "listing_id" UUID NOT NULL,
    "province_id" UUID NOT NULL,
    "district_id" UUID,
    "neighborhood" TEXT,
    "address_line" TEXT,
    "postal_code" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),

    CONSTRAINT "listing_locations_pkey" PRIMARY KEY ("listing_id")
);

-- CreateTable
CREATE TABLE "listing_service_areas" (
    "listing_id" UUID NOT NULL,
    "province_id" UUID NOT NULL,

    CONSTRAINT "listing_service_areas_pkey" PRIMARY KEY ("listing_id","province_id")
);

-- CreateTable
CREATE TABLE "listing_lodging" (
    "listing_id" UUID NOT NULL,
    "tourism_license_no" TEXT,
    "license_verified_at" TIMESTAMPTZ(3),
    "check_in_time" TEXT,
    "check_out_time" TEXT,

    CONSTRAINT "listing_lodging_pkey" PRIMARY KEY ("listing_id")
);

-- CreateTable
CREATE TABLE "listing_product" (
    "listing_id" UUID NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "gtin" TEXT,
    "release_date" DATE,

    CONSTRAINT "listing_product_pkey" PRIMARY KEY ("listing_id")
);

-- CreateTable
CREATE TABLE "listing_experience" (
    "listing_id" UUID NOT NULL,
    "duration_minutes" INTEGER,
    "start_point" TEXT,

    CONSTRAINT "listing_experience_pkey" PRIMARY KEY ("listing_id")
);

-- CreateTable
CREATE TABLE "listing_event" (
    "listing_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(3),
    "ends_at" TIMESTAMPTZ(3),
    "venue_listing_id" UUID,

    CONSTRAINT "listing_event_pkey" PRIMARY KEY ("listing_id")
);

-- CreateTable
CREATE TABLE "listing_guide" (
    "listing_id" UUID NOT NULL,
    "languages" TEXT[],
    "license_verified_at" TIMESTAMPTZ(3),
    "consent_at" TIMESTAMPTZ(3),

    CONSTRAINT "listing_guide_pkey" PRIMARY KEY ("listing_id")
);

-- CreateTable
CREATE TABLE "slug_history" (
    "id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slug_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_approvals" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "approved_by" TEXT NOT NULL,
    "note" TEXT,
    "approved_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(3),

    CONSTRAINT "legal_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_areas_level_idx" ON "admin_areas"("level");

-- CreateIndex
CREATE UNIQUE INDEX "admin_areas_parent_id_slug_key" ON "admin_areas"("parent_id", "slug");

-- CreateIndex
CREATE INDEX "listing_categories_category_id_idx" ON "listing_categories"("category_id");

-- CreateIndex
CREATE INDEX "listing_locations_province_id_district_id_idx" ON "listing_locations"("province_id", "district_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_product_gtin_key" ON "listing_product"("gtin");

-- CreateIndex
CREATE INDEX "listing_product_brand_model_idx" ON "listing_product"("brand", "model");

-- CreateIndex
CREATE INDEX "listing_event_starts_at_idx" ON "listing_event"("starts_at");

-- CreateIndex
CREATE INDEX "slug_history_entity_type_entity_id_idx" ON "slug_history"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "slug_history_entity_type_slug_key" ON "slug_history"("entity_type", "slug");

-- CreateIndex
CREATE INDEX "legal_approvals_category_id_idx" ON "legal_approvals"("category_id");

-- AddForeignKey
ALTER TABLE "admin_areas" ADD CONSTRAINT "admin_areas_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "admin_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_categories" ADD CONSTRAINT "listing_categories_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_categories" ADD CONSTRAINT "listing_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_locations" ADD CONSTRAINT "listing_locations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_locations" ADD CONSTRAINT "listing_locations_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "admin_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_locations" ADD CONSTRAINT "listing_locations_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "admin_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_service_areas" ADD CONSTRAINT "listing_service_areas_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_service_areas" ADD CONSTRAINT "listing_service_areas_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "admin_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_lodging" ADD CONSTRAINT "listing_lodging_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_product" ADD CONSTRAINT "listing_product_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_experience" ADD CONSTRAINT "listing_experience_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_event" ADD CONSTRAINT "listing_event_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_event" ADD CONSTRAINT "listing_event_venue_listing_id_fkey" FOREIGN KEY ("venue_listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_guide" ADD CONSTRAINT "listing_guide_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_approvals" ADD CONSTRAINT "legal_approvals_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- REQ-VER-009: idari bölgeler — 81 il (plaka kodlarıyla) ve lansman illerinin (A-003) ilçeleri.
-- Kaynak ve doğrulama: ADR-0011, MQA-003 (resmî listeyle karşılaştırma). Diğer illerin ilçeleri ayrı migration'la eklenir.
INSERT INTO "admin_areas" ("id", "level", "name", "slug", "code", "parent_id") VALUES
  (gen_random_uuid(), 'PROVINCE', 'Adana', 'adana', '01', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Adıyaman', 'adiyaman', '02', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Afyonkarahisar', 'afyonkarahisar', '03', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Ağrı', 'agri', '04', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Amasya', 'amasya', '05', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Ankara', 'ankara', '06', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Antalya', 'antalya', '07', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Artvin', 'artvin', '08', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Aydın', 'aydin', '09', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Balıkesir', 'balikesir', '10', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Bilecik', 'bilecik', '11', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Bingöl', 'bingol', '12', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Bitlis', 'bitlis', '13', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Bolu', 'bolu', '14', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Burdur', 'burdur', '15', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Bursa', 'bursa', '16', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Çanakkale', 'canakkale', '17', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Çankırı', 'cankiri', '18', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Çorum', 'corum', '19', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Denizli', 'denizli', '20', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Diyarbakır', 'diyarbakir', '21', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Edirne', 'edirne', '22', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Elazığ', 'elazig', '23', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Erzincan', 'erzincan', '24', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Erzurum', 'erzurum', '25', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Eskişehir', 'eskisehir', '26', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Gaziantep', 'gaziantep', '27', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Giresun', 'giresun', '28', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Gümüşhane', 'gumushane', '29', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Hakkâri', 'hakkari', '30', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Hatay', 'hatay', '31', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Isparta', 'isparta', '32', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Mersin', 'mersin', '33', NULL),
  (gen_random_uuid(), 'PROVINCE', 'İstanbul', 'istanbul', '34', NULL),
  (gen_random_uuid(), 'PROVINCE', 'İzmir', 'izmir', '35', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Kars', 'kars', '36', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Kastamonu', 'kastamonu', '37', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Kayseri', 'kayseri', '38', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Kırklareli', 'kirklareli', '39', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Kırşehir', 'kirsehir', '40', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Kocaeli', 'kocaeli', '41', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Konya', 'konya', '42', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Kütahya', 'kutahya', '43', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Malatya', 'malatya', '44', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Manisa', 'manisa', '45', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Kahramanmaraş', 'kahramanmaras', '46', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Mardin', 'mardin', '47', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Muğla', 'mugla', '48', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Muş', 'mus', '49', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Nevşehir', 'nevsehir', '50', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Niğde', 'nigde', '51', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Ordu', 'ordu', '52', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Rize', 'rize', '53', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Sakarya', 'sakarya', '54', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Samsun', 'samsun', '55', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Siirt', 'siirt', '56', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Sinop', 'sinop', '57', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Sivas', 'sivas', '58', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Tekirdağ', 'tekirdag', '59', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Tokat', 'tokat', '60', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Trabzon', 'trabzon', '61', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Tunceli', 'tunceli', '62', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Şanlıurfa', 'sanliurfa', '63', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Uşak', 'usak', '64', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Van', 'van', '65', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Yozgat', 'yozgat', '66', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Zonguldak', 'zonguldak', '67', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Aksaray', 'aksaray', '68', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Bayburt', 'bayburt', '69', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Karaman', 'karaman', '70', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Kırıkkale', 'kirikkale', '71', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Batman', 'batman', '72', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Şırnak', 'sirnak', '73', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Bartın', 'bartin', '74', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Ardahan', 'ardahan', '75', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Iğdır', 'igdir', '76', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Yalova', 'yalova', '77', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Karabük', 'karabuk', '78', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Kilis', 'kilis', '79', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Osmaniye', 'osmaniye', '80', NULL),
  (gen_random_uuid(), 'PROVINCE', 'Düzce', 'duzce', '81', NULL);
INSERT INTO "admin_areas" ("id", "level", "name", "slug", "parent_id")
  SELECT gen_random_uuid(), 'DISTRICT', d.name, d.slug, p.id FROM "admin_areas" p, (VALUES
    ('Adalar', 'adalar'),
    ('Arnavutköy', 'arnavutkoy'),
    ('Ataşehir', 'atasehir'),
    ('Avcılar', 'avcilar'),
    ('Bağcılar', 'bagcilar'),
    ('Bahçelievler', 'bahcelievler'),
    ('Bakırköy', 'bakirkoy'),
    ('Başakşehir', 'basaksehir'),
    ('Bayrampaşa', 'bayrampasa'),
    ('Beşiktaş', 'besiktas'),
    ('Beykoz', 'beykoz'),
    ('Beylikdüzü', 'beylikduzu'),
    ('Beyoğlu', 'beyoglu'),
    ('Büyükçekmece', 'buyukcekmece'),
    ('Çatalca', 'catalca'),
    ('Çekmeköy', 'cekmekoy'),
    ('Esenler', 'esenler'),
    ('Esenyurt', 'esenyurt'),
    ('Eyüpsultan', 'eyupsultan'),
    ('Fatih', 'fatih'),
    ('Gaziosmanpaşa', 'gaziosmanpasa'),
    ('Güngören', 'gungoren'),
    ('Kadıköy', 'kadikoy'),
    ('Kağıthane', 'kagithane'),
    ('Kartal', 'kartal'),
    ('Küçükçekmece', 'kucukcekmece'),
    ('Maltepe', 'maltepe'),
    ('Pendik', 'pendik'),
    ('Sancaktepe', 'sancaktepe'),
    ('Sarıyer', 'sariyer'),
    ('Silivri', 'silivri'),
    ('Sultanbeyli', 'sultanbeyli'),
    ('Sultangazi', 'sultangazi'),
    ('Şile', 'sile'),
    ('Şişli', 'sisli'),
    ('Tuzla', 'tuzla'),
    ('Ümraniye', 'umraniye'),
    ('Üsküdar', 'uskudar'),
    ('Zeytinburnu', 'zeytinburnu')
  ) AS d(name, slug) WHERE p."level" = 'PROVINCE' AND p."code" = '34';
INSERT INTO "admin_areas" ("id", "level", "name", "slug", "parent_id")
  SELECT gen_random_uuid(), 'DISTRICT', d.name, d.slug, p.id FROM "admin_areas" p, (VALUES
    ('Aliağa', 'aliaga'),
    ('Balçova', 'balcova'),
    ('Bayındır', 'bayindir'),
    ('Bayraklı', 'bayrakli'),
    ('Bergama', 'bergama'),
    ('Beydağ', 'beydag'),
    ('Bornova', 'bornova'),
    ('Buca', 'buca'),
    ('Çeşme', 'cesme'),
    ('Çiğli', 'cigli'),
    ('Dikili', 'dikili'),
    ('Foça', 'foca'),
    ('Gaziemir', 'gaziemir'),
    ('Güzelbahçe', 'guzelbahce'),
    ('Karabağlar', 'karabaglar'),
    ('Karaburun', 'karaburun'),
    ('Karşıyaka', 'karsiyaka'),
    ('Kemalpaşa', 'kemalpasa'),
    ('Kınık', 'kinik'),
    ('Kiraz', 'kiraz'),
    ('Konak', 'konak'),
    ('Menderes', 'menderes'),
    ('Menemen', 'menemen'),
    ('Narlıdere', 'narlidere'),
    ('Ödemiş', 'odemis'),
    ('Seferihisar', 'seferihisar'),
    ('Selçuk', 'selcuk'),
    ('Tire', 'tire'),
    ('Torbalı', 'torbali'),
    ('Urla', 'urla')
  ) AS d(name, slug) WHERE p."level" = 'PROVINCE' AND p."code" = '35';
INSERT INTO "admin_areas" ("id", "level", "name", "slug", "parent_id")
  SELECT gen_random_uuid(), 'DISTRICT', d.name, d.slug, p.id FROM "admin_areas" p, (VALUES
    ('Akseki', 'akseki'),
    ('Aksu', 'aksu'),
    ('Alanya', 'alanya'),
    ('Demre', 'demre'),
    ('Döşemealtı', 'dosemealti'),
    ('Elmalı', 'elmali'),
    ('Finike', 'finike'),
    ('Gazipaşa', 'gazipasa'),
    ('Gündoğmuş', 'gundogmus'),
    ('İbradı', 'ibradi'),
    ('Kaş', 'kas'),
    ('Kemer', 'kemer'),
    ('Kepez', 'kepez'),
    ('Konyaaltı', 'konyaalti'),
    ('Korkuteli', 'korkuteli'),
    ('Kumluca', 'kumluca'),
    ('Manavgat', 'manavgat'),
    ('Muratpaşa', 'muratpasa'),
    ('Serik', 'serik')
  ) AS d(name, slug) WHERE p."level" = 'PROVINCE' AND p."code" = '07';
INSERT INTO "admin_areas" ("id", "level", "name", "slug", "parent_id")
  SELECT gen_random_uuid(), 'DISTRICT', d.name, d.slug, p.id FROM "admin_areas" p, (VALUES
    ('Bodrum', 'bodrum'),
    ('Dalaman', 'dalaman'),
    ('Datça', 'datca'),
    ('Fethiye', 'fethiye'),
    ('Kavaklıdere', 'kavaklidere'),
    ('Köyceğiz', 'koycegiz'),
    ('Marmaris', 'marmaris'),
    ('Menteşe', 'mentese'),
    ('Milas', 'milas'),
    ('Ortaca', 'ortaca'),
    ('Seydikemer', 'seydikemer'),
    ('Ula', 'ula'),
    ('Yatağan', 'yatagan')
  ) AS d(name, slug) WHERE p."level" = 'PROVINCE' AND p."code" = '48';
INSERT INTO "admin_areas" ("id", "level", "name", "slug", "parent_id")
  SELECT gen_random_uuid(), 'DISTRICT', d.name, d.slug, p.id FROM "admin_areas" p, (VALUES
    ('Acıgöl', 'acigol'),
    ('Avanos', 'avanos'),
    ('Derinkuyu', 'derinkuyu'),
    ('Gülşehir', 'gulsehir'),
    ('Hacıbektaş', 'hacibektas'),
    ('Kozaklı', 'kozakli'),
    ('Merkez', 'merkez'),
    ('Ürgüp', 'urgup')
  ) AS d(name, slug) WHERE p."level" = 'PROVINCE' AND p."code" = '50';

-- İl slug'ları kök düzeyinde benzersiz (parent_id NULL olduğundan bileşik benzersizlik yetmez).
CREATE UNIQUE INDEX "admin_areas_province_slug_key" ON "admin_areas"("slug") WHERE "parent_id" IS NULL;
ALTER TABLE "admin_areas" ADD CONSTRAINT "admin_areas_level_parent" CHECK (("level" = 'PROVINCE') = ("parent_id" IS NULL));

-- Konum: koordinat aralıkları, ikisi birlikte; PostGIS noktası üretilen sütun + GiST (REQ-VER-009).
ALTER TABLE "listing_locations" ADD CONSTRAINT "listing_locations_lat_range" CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90);
ALTER TABLE "listing_locations" ADD CONSTRAINT "listing_locations_lng_range" CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180);
ALTER TABLE "listing_locations" ADD CONSTRAINT "listing_locations_lat_lng_pair" CHECK (("latitude" IS NULL) = ("longitude" IS NULL));
ALTER TABLE "listing_locations" ADD COLUMN "geo" geography(Point, 4326) GENERATED ALWAYS AS (
  CASE WHEN "latitude" IS NOT NULL AND "longitude" IS NOT NULL
    THEN ST_SetSRID(ST_MakePoint("longitude"::float8, "latitude"::float8), 4326)::geography END
) STORED;
CREATE INDEX "listing_locations_geo_idx" ON "listing_locations" USING GIST ("geo");

ALTER TABLE "listings" ADD CONSTRAINT "listings_contacts_object" CHECK (jsonb_typeof("contacts") = 'object');
ALTER TABLE "listings" ADD CONSTRAINT "listings_attributes_object" CHECK (jsonb_typeof("attributes") = 'object');
ALTER TABLE "listing_event" ADD CONSTRAINT "listing_event_range" CHECK ("ends_at" IS NULL OR "starts_at" IS NULL OR "ends_at" >= "starts_at");
ALTER TABLE "listing_experience" ADD CONSTRAINT "listing_experience_duration" CHECK ("duration_minutes" IS NULL OR "duration_minutes" > 0);
