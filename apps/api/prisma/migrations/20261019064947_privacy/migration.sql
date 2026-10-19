-- CreateEnum
CREATE TYPE "DataRequestType" AS ENUM ('INFO', 'ACCESS', 'RECTIFICATION', 'ERASURE', 'OBJECTION', 'COMPENSATION');

-- CreateEnum
CREATE TYPE "DataRequestStatus" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'ANSWERED', 'REJECTED');

-- CreateTable
CREATE TABLE "data_subject_requests" (
    "id" UUID NOT NULL,
    "type" "DataRequestType" NOT NULL,
    "channel" TEXT NOT NULL,
    "user_id" UUID,
    "email" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "identity_verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "DataRequestStatus" NOT NULL DEFAULT 'RECEIVED',
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMPTZ(3) NOT NULL,
    "answered_at" TIMESTAMPTZ(3),
    "response_note" TEXT,
    "rejection_reason" TEXT,
    "handled_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "data_subject_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_document_versions" (
    "id" UUID NOT NULL,
    "doc_type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "effective_at" TIMESTAMPTZ(3) NOT NULL,
    "content_hash" TEXT NOT NULL,
    "material" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_acceptances" (
    "user_id" UUID NOT NULL,
    "version_id" UUID NOT NULL,
    "accepted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL DEFAULT 'WEB',

    CONSTRAINT "legal_acceptances_pkey" PRIMARY KEY ("user_id","version_id")
);

-- CreateTable
CREATE TABLE "destruction_logs" (
    "id" BIGSERIAL NOT NULL,
    "ran_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "cutoff" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "destruction_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breach_incidents" (
    "id" UUID NOT NULL,
    "detected_at" TIMESTAMPTZ(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'DETECTED',
    "data_categories" TEXT[],
    "affected_count" INTEGER,
    "notify_deadline" TIMESTAMPTZ(3),
    "root_cause" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "breach_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "data_subject_requests_status_due_at_idx" ON "data_subject_requests"("status", "due_at");

-- CreateIndex
CREATE UNIQUE INDEX "legal_document_versions_doc_type_version_key" ON "legal_document_versions"("doc_type", "version");

-- CreateIndex
CREATE INDEX "destruction_logs_ran_at_idx" ON "destruction_logs"("ran_at");

-- AddForeignKey
ALTER TABLE "data_subject_requests" ADD CONSTRAINT "data_subject_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "legal_document_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "data_subject_requests" ADD CONSTRAINT "dsr_channel" CHECK ("channel" IN ('WEB_FORM', 'IN_APP', 'MANUAL'));
ALTER TABLE "data_subject_requests" ADD CONSTRAINT "dsr_due" CHECK ("due_at" > "received_at");
ALTER TABLE "data_subject_requests" ADD CONSTRAINT "dsr_rejection" CHECK ("status" <> 'REJECTED' OR "rejection_reason" IS NOT NULL);
ALTER TABLE "legal_document_versions" ADD CONSTRAINT "legal_doc_type" CHECK ("doc_type" IN ('TERMS', 'PRIVACY_NOTICE', 'COOKIE_POLICY'));
ALTER TABLE "legal_document_versions" ADD CONSTRAINT "legal_doc_approval" CHECK (("approved_by" IS NULL) = ("approved_at" IS NULL));
ALTER TABLE "destruction_logs" ADD CONSTRAINT "destruction_method" CHECK ("method" IN ('DELETE', 'ANONYMIZE'));
ALTER TABLE "breach_incidents" ADD CONSTRAINT "breach_stage" CHECK ("stage" IN ('DETECTED', 'CONTAINED', 'ASSESSED', 'NOTIFIED', 'CLOSED'));
