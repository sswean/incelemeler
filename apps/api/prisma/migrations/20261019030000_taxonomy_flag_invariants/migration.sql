-- REQ-KAT-004: YMYL ve lisanslı kategoride sponsorluk kapalı; YMYL kategoride uzman incelemesi zorunlu.
UPDATE "categories" SET "sponsorship_allowed" = false WHERE "ymyl" OR "requires_license";
UPDATE "categories" SET "requires_expert_review" = true WHERE "ymyl";
ALTER TABLE "categories" ADD CONSTRAINT "categories_restricted_no_sponsorship"
  CHECK (NOT ("ymyl" OR "requires_license") OR NOT "sponsorship_allowed");
ALTER TABLE "categories" ADD CONSTRAINT "categories_ymyl_expert_review"
  CHECK (NOT "ymyl" OR "requires_expert_review");
