-- CreateEnum
CREATE TYPE "TakedownKind" AS ENUM ('COPYRIGHT', 'PERSONALITY_RIGHTS', 'OTHER_LEGAL', 'COURT_ORDER', 'ADMINISTRATIVE_ORDER');

-- CreateEnum
CREATE TYPE "TakedownStatus" AS ENUM ('RECEIVED', 'IN_REVIEW', 'ACTIONED', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "takedown_requests" (
    "id" UUID NOT NULL,
    "kind" "TakedownKind" NOT NULL,
    "channel" TEXT NOT NULL,
    "requester_name" TEXT NOT NULL,
    "requester_org" TEXT,
    "requester_email" TEXT NOT NULL,
    "requester_capacity" TEXT NOT NULL,
    "legal_basis" TEXT NOT NULL,
    "authority_reference" TEXT,
    "target_url" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "documents_note" TEXT,
    "status" "TakedownStatus" NOT NULL DEFAULT 'RECEIVED',
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMPTZ(3) NOT NULL,
    "decided_at" TIMESTAMPTZ(3),
    "decided_by" UUID,
    "rejection_reason" TEXT,
    "decision_note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "takedown_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "takedown_requests_status_due_at_idx" ON "takedown_requests"("status", "due_at");


-- Resmî kararlar yalnızca panelden ve karar referansıyla; kararlı kayıtta karar zamanı; ret gerekçeli (REQ-GUN-005).
ALTER TABLE "takedown_requests" ADD CONSTRAINT "takedown_requests_order_ck"
  CHECK ("kind" NOT IN ('COURT_ORDER', 'ADMINISTRATIVE_ORDER')
         OR ("channel" = 'MANUAL' AND "authority_reference" IS NOT NULL));
ALTER TABLE "takedown_requests" ADD CONSTRAINT "takedown_requests_decision_ck"
  CHECK (("status" IN ('ACTIONED', 'REJECTED')) = ("decided_at" IS NOT NULL));
ALTER TABLE "takedown_requests" ADD CONSTRAINT "takedown_requests_rejection_ck"
  CHECK ("status" <> 'REJECTED' OR "rejection_reason" IS NOT NULL);
