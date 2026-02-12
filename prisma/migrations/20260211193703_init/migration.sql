-- CreateEnum
CREATE TYPE "Site" AS ENUM ('UAE', 'EG', 'KSA');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('QA_MEMBER', 'QA_LEAD', 'MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MainRCA" AS ENUM ('AGENT', 'PROCESS', 'TECHNOLOGY', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "CodeScope" AS ENUM ('GLOBAL', 'SITE');

-- CreateEnum
CREATE TYPE "CodeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DEPRECATED', 'MERGED');

-- CreateEnum
CREATE TYPE "DecisionType" AS ENUM ('APPROVED', 'APPROVED_WITH_EDITS', 'REJECTED', 'MERGED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('AGREE', 'DISAGREE', 'SUGGEST_EXISTING', 'SUGGEST_RENAME', 'SUGGEST_MERGE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "site" "Site" NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'QA_MEMBER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rca_codes" (
    "id" TEXT NOT NULL,
    "scope" "CodeScope" NOT NULL DEFAULT 'GLOBAL',
    "site" "Site",
    "status" "CodeStatus" NOT NULL DEFAULT 'PENDING',
    "main_rca" "MainRCA" NOT NULL,
    "rca1" TEXT,
    "rca2" TEXT,
    "rca3" TEXT,
    "rca4" TEXT,
    "rca5" TEXT,
    "definition" TEXT NOT NULL,
    "use_when" TEXT,
    "dont_use_when" TEXT,
    "examples" JSONB NOT NULL DEFAULT '[]',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "reject_reason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "rejected_by_id" TEXT,
    "merged_into_id" TEXT,
    "deprecated_replaced_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rca_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "reaction" "ReactionType",
    "user_id" TEXT NOT NULL,
    "rca_code_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisions" (
    "id" TEXT NOT NULL,
    "decision_type" "DecisionType" NOT NULL,
    "reason" TEXT,
    "proposal_id" TEXT NOT NULL,
    "decided_by_id" TEXT NOT NULL,
    "edited_fields" JSONB,
    "merge_target_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "actor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_examples" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "code_id" TEXT NOT NULL,
    "site" "Site" NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_examples_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "rca_codes" ADD CONSTRAINT "rca_codes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rca_codes" ADD CONSTRAINT "rca_codes_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rca_codes" ADD CONSTRAINT "rca_codes_rejected_by_id_fkey" FOREIGN KEY ("rejected_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rca_codes" ADD CONSTRAINT "rca_codes_merged_into_id_fkey" FOREIGN KEY ("merged_into_id") REFERENCES "rca_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rca_codes" ADD CONSTRAINT "rca_codes_deprecated_replaced_by_id_fkey" FOREIGN KEY ("deprecated_replaced_by_id") REFERENCES "rca_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_rca_code_id_fkey" FOREIGN KEY ("rca_code_id") REFERENCES "rca_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "rca_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_examples" ADD CONSTRAINT "case_examples_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "rca_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_examples" ADD CONSTRAINT "case_examples_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
