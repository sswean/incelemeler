-- CreateTable
CREATE TABLE "consent_records" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID,
    "anonymous_id" UUID NOT NULL,
    "purpose" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "text_version" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "ip_hash" TEXT,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consent_records_anonymous_id_created_at_idx" ON "consent_records"("anonymous_id", "created_at");

-- CreateIndex
CREATE INDEX "consent_records_user_id_idx" ON "consent_records"("user_id");


ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_purpose" CHECK ("purpose" IN ('FUNCTIONAL', 'ANALYTICS', 'MARKETING'));
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_channel" CHECK ("channel" IN ('WEB', 'IOS', 'ANDROID'));
