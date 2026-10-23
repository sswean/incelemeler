-- CreateTable
CREATE TABLE "editorial_verdicts" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "article_id" UUID,
    "version" INTEGER NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "experience_type" "ExperienceType" NOT NULL,
    "experience_note" TEXT,
    "tested_at" DATE,
    "score" DECIMAL(3,1),
    "criteria" JSONB NOT NULL DEFAULT '[]',
    "pros" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "summary" TEXT NOT NULL,
    "author_id" UUID NOT NULL,
    "published_at" TIMESTAMPTZ(3),
    "published_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "editorial_verdicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "editorial_verdicts_article_id_idx" ON "editorial_verdicts"("article_id");

-- CreateIndex
CREATE UNIQUE INDEX "editorial_verdicts_listing_id_version_key" ON "editorial_verdicts"("listing_id", "version");

-- AddForeignKey
ALTER TABLE "editorial_verdicts" ADD CONSTRAINT "editorial_verdicts_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editorial_verdicts" ADD CONSTRAINT "editorial_verdicts_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editorial_verdicts" ADD CONSTRAINT "editorial_verdicts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editorial_verdicts" ADD CONSTRAINT "editorial_verdicts_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Editör puanı 0–10, 0,5 adım; derlemede puan yok (REQ-VER-005, REQ-ICR-007).
ALTER TABLE "editorial_verdicts" ADD CONSTRAINT "editorial_verdicts_score_range"
  CHECK ("score" IS NULL OR ("score" >= 0 AND "score" <= 10 AND "score" * 2 = trunc("score" * 2)));
ALTER TABLE "editorial_verdicts" ADD CONSTRAINT "editorial_verdicts_research_no_score"
  CHECK ("experience_type" <> 'RESEARCH_ONLY' OR ("score" IS NULL AND "criteria" = '[]'::jsonb));
ALTER TABLE "editorial_verdicts" ADD CONSTRAINT "editorial_verdicts_version_positive" CHECK ("version" >= 1);
ALTER TABLE "editorial_verdicts" ADD CONSTRAINT "editorial_verdicts_criteria_array"
  CHECK (jsonb_typeof("criteria") = 'array');
ALTER TABLE "editorial_verdicts" ADD CONSTRAINT "editorial_verdicts_published_by"
  CHECK (("published_at" IS NULL) = ("published_by_id" IS NULL));

-- Listeleme başına tek güncel sürüm.
CREATE UNIQUE INDEX "editorial_verdicts_one_current" ON "editorial_verdicts" ("listing_id") WHERE "is_current";

-- Sürümler değişmez: yalnızca güncellik ve (bir kez) yayın bilgisi değişebilir.
CREATE FUNCTION editorial_verdicts_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.listing_id, NEW.version, NEW.experience_type, NEW.experience_note, NEW.tested_at, NEW.score,
      NEW.criteria, NEW.pros, NEW.cons, NEW.summary, NEW.author_id, NEW.created_at)
     IS DISTINCT FROM
     (OLD.listing_id, OLD.version, OLD.experience_type, OLD.experience_note, OLD.tested_at, OLD.score,
      OLD.criteria, OLD.pros, OLD.cons, OLD.summary, OLD.author_id, OLD.created_at) THEN
    RAISE EXCEPTION 'editorial_verdicts sürümleri değiştirilemez; yeni sürüm oluşturun';
  END IF;
  IF OLD.published_at IS NOT NULL AND NEW.published_at IS DISTINCT FROM OLD.published_at THEN
    RAISE EXCEPTION 'Yayımlanmış sürümün yayın bilgisi değiştirilemez';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER editorial_verdicts_immutable BEFORE UPDATE ON "editorial_verdicts"
  FOR EACH ROW EXECUTE FUNCTION editorial_verdicts_immutable();
