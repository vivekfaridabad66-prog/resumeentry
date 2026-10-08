-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ResumeStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVIEW', 'DUPLICATE', 'CANCELLED');

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "status" "ResumeStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "batchId" TEXT,
    "duplicateOf" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeExtraction" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "name" TEXT,
    "nameConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "email" TEXT,
    "otherEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emailConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "phone" TEXT,
    "countryCode" TEXT,
    "normalizedPhone" TEXT,
    "phoneConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "designation" TEXT,
    "designationConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requiresReview" BOOLEAN NOT NULL DEFAULT true,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingBatch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "processedFiles" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingJob" (
    "id" TEXT NOT NULL,
    "batchId" TEXT,
    "queueJobId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "total" INTEGER NOT NULL DEFAULT 0,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Duplicate" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "originalResumeId" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Duplicate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractionError" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractionError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resume_filePath_key" ON "Resume"("filePath");

-- CreateIndex
CREATE INDEX "Resume_status_createdAt_idx" ON "Resume"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Resume_batchId_status_idx" ON "Resume"("batchId", "status");

-- CreateIndex
CREATE INDEX "Resume_fileHash_idx" ON "Resume"("fileHash");

-- CreateIndex
CREATE INDEX "Resume_processedAt_idx" ON "Resume"("processedAt");

-- CreateIndex
CREATE INDEX "Resume_fileName_idx" ON "Resume"("fileName");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeExtraction_resumeId_key" ON "ResumeExtraction"("resumeId");

-- CreateIndex
CREATE INDEX "ResumeExtraction_email_idx" ON "ResumeExtraction"("email");

-- CreateIndex
CREATE INDEX "ResumeExtraction_normalizedPhone_idx" ON "ResumeExtraction"("normalizedPhone");

-- CreateIndex
CREATE INDEX "ResumeExtraction_requiresReview_overallConfidence_idx" ON "ResumeExtraction"("requiresReview", "overallConfidence");

-- CreateIndex
CREATE INDEX "ProcessingBatch_status_createdAt_idx" ON "ProcessingBatch"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingJob_queueJobId_key" ON "ProcessingJob"("queueJobId");

-- CreateIndex
CREATE INDEX "Duplicate_matchType_idx" ON "Duplicate"("matchType");

-- CreateIndex
CREATE UNIQUE INDEX "Duplicate_resumeId_originalResumeId_key" ON "Duplicate"("resumeId", "originalResumeId");

-- CreateIndex
CREATE INDEX "ExtractionError_resumeId_createdAt_idx" ON "ExtractionError"("resumeId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProcessingBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeExtraction" ADD CONSTRAINT "ResumeExtraction_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingJob" ADD CONSTRAINT "ProcessingJob_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProcessingBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Duplicate" ADD CONSTRAINT "Duplicate_originalResumeId_fkey" FOREIGN KEY ("originalResumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionError" ADD CONSTRAINT "ExtractionError_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
