import "dotenv/config";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../lib/db";

const batchId = "seed-resume-test-batch";
const storageDirectory = path.resolve(process.env.STORAGE_PATH ?? "private-uploads", "seed");
const fixtureDirectory = path.resolve("tests/fixtures");

const candidates = [
  {
    id: "seed-resume-completed",
    fixture: "sample-resume.pdf",
    fileName: "Jordan-Casey-Resume.pdf",
    status: "COMPLETED" as const,
    extraction: {
      name: "Jordan Casey",
      nameConfidence: 0.98,
      email: "jordan.casey@example.com",
      emailConfidence: 0.99,
      phone: "+1 415 555 0136",
      countryCode: "US",
      normalizedPhone: "+14155550136",
      phoneConfidence: 0.94,
      designation: "Senior Software Engineer",
      designationConfidence: 0.91,
      overallConfidence: 0.95,
      requiresReview: false,
    },
  },
  {
    id: "seed-resume-review",
    fixture: "sample-resume.docx",
    fileName: "Casey-Jordan-Resume.docx",
    status: "REVIEW" as const,
    extraction: {
      name: "Casey Jordan",
      nameConfidence: 0.87,
      email: "casey.jordan@example.com",
      emailConfidence: 0.96,
      phone: null,
      countryCode: null,
      normalizedPhone: null,
      phoneConfidence: 0,
      designation: "Data Analyst",
      designationConfidence: 0.73,
      overallConfidence: 0.82,
      requiresReview: true,
    },
  },
  {
    id: "seed-resume-failed",
    fixture: "corrupt.pdf",
    fileName: "Unreadable-Resume.pdf",
    status: "FAILED" as const,
    extraction: null,
  },
  {
    id: "seed-resume-duplicate",
    fixture: "sample-resume.pdf",
    fileName: "Jordan-Casey-Copy.pdf",
    status: "DUPLICATE" as const,
    extraction: null,
  },
  {
    id: "seed-resume-pending",
    fixture: "sample-resume.docx",
    fileName: "Pending-Test-Resume.docx",
    status: "PENDING" as const,
    extraction: null,
  },
];

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPasswordHash = process.env.SEED_ADMIN_PASSWORD_HASH;
  if (!adminEmail || !adminPasswordHash) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD_HASH to create the initial admin user before seeding.");
  }

  await db.user.upsert({
    where: { email: adminEmail },
    create: {
      name: "Workspace Administrator",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      isActive: true,
    },
    update: {
      name: "Workspace Administrator",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  await mkdir(storageDirectory, { recursive: true });

  await db.processingBatch.upsert({
    where: { id: batchId },
    create: {
      id: batchId,
      name: "Synthetic test resumes",
      status: "PROCESSING",
      totalFiles: candidates.length,
      processedFiles: candidates.length - 1,
    },
    update: {
      name: "Synthetic test resumes",
      status: "PROCESSING",
      totalFiles: candidates.length,
      processedFiles: candidates.length - 1,
    },
  });

  for (const candidate of candidates) {
    const filePath = path.join(storageDirectory, `${candidate.id}${path.extname(candidate.fixture)}`);
    const fixturePath = path.join(fixtureDirectory, candidate.fixture);
    await copyFile(fixturePath, filePath);
    const contents = await readFile(filePath);

    await db.resume.upsert({
      where: { id: candidate.id },
      create: {
        id: candidate.id,
        fileName: candidate.fileName,
        filePath,
        fileType: path.extname(candidate.fixture).slice(1),
        fileSize: BigInt(contents.byteLength),
        fileHash: createHash("sha256").update(contents).digest("hex"),
        status: candidate.status,
        processedAt: candidate.status === "PENDING" ? null : new Date(),
        batchId,
        duplicateOf: candidate.id === "seed-resume-duplicate" ? "seed-resume-completed" : null,
      },
      update: {
        fileName: candidate.fileName,
        filePath,
        fileType: path.extname(candidate.fixture).slice(1),
        fileSize: BigInt(contents.byteLength),
        fileHash: createHash("sha256").update(contents).digest("hex"),
        status: candidate.status,
        processedAt: candidate.status === "PENDING" ? null : new Date(),
        batchId,
        duplicateOf: candidate.id === "seed-resume-duplicate" ? "seed-resume-completed" : null,
      },
    });

    if (candidate.extraction) {
      await db.resumeExtraction.upsert({
        where: { resumeId: candidate.id },
        create: { resumeId: candidate.id, ...candidate.extraction },
        update: candidate.extraction,
      });
    } else {
      await db.resumeExtraction.deleteMany({ where: { resumeId: candidate.id } });
    }

    if (candidate.id === "seed-resume-duplicate") {
      await db.duplicate.upsert({
        where: {
          resumeId_originalResumeId: {
            resumeId: candidate.id,
            originalResumeId: "seed-resume-completed",
          },
        },
        create: {
          resumeId: candidate.id,
          originalResumeId: "seed-resume-completed",
          matchType: "FILE_HASH",
        },
        update: { matchType: "FILE_HASH" },
      });
    }

    if (candidate.id === "seed-resume-failed") {
      await db.extractionError.upsert({
        where: { id: "seed-resume-failed-error" },
        create: {
          id: "seed-resume-failed-error",
          resumeId: candidate.id,
          errorType: "INVALID_FILE",
          errorMessage: "Synthetic corrupt PDF fixture for testing error handling.",
        },
        update: {
          resumeId: candidate.id,
          errorType: "INVALID_FILE",
          errorMessage: "Synthetic corrupt PDF fixture for testing error handling.",
          retryCount: 0,
        },
      });
    }
  }

  await db.processingJob.upsert({
    where: { id: "seed-resume-test-job" },
    create: {
      id: "seed-resume-test-job",
      batchId,
      status: "PROCESSING",
      total: candidates.length,
      completed: candidates.length - 1,
      failed: 1,
    },
    update: {
      batchId,
      status: "PROCESSING",
      total: candidates.length,
      completed: candidates.length - 1,
      failed: 1,
    },
  });

  console.info(`Seeded admin user ${adminEmail} and ${candidates.length} synthetic resumes in batch ${batchId}.`);
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
