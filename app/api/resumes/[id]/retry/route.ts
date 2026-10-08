import { requireApiSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getResumeQueue } from "@/lib/queue";
export async function POST(_request: Request, context: RouteContext<"/api/resumes/[id]/retry">) {
  const unauthorized = await requireApiSession(); if (unauthorized) return unauthorized;
  const { id } = await context.params;
  const resume = await db.resume.findUnique({ where: { id } });
  if (!resume) return Response.json({ error: "Resume not found." }, { status: 404 });
  if (resume.status !== "FAILED") return Response.json({ error: "Only failed resumes can be retried." }, { status: 409 });
  if (resume.status === "FAILED" && resume.batchId) await db.$transaction([db.resume.update({ where: { id }, data: { status: "PENDING", processedAt: null } }), db.processingBatch.update({ where: { id: resume.batchId }, data: { processedFiles: { decrement: 1 }, status: "PROCESSING" } })]);
  else await db.resume.update({ where: { id }, data: { status: "PENDING", processedAt: null } });
  await getResumeQueue().add("process-resume", { resumeId: id }, { jobId: `${id}-${Date.now()}`, attempts: 3 });
  return Response.json({ queued: true }, { status: 202 });
}
