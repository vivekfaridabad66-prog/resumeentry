import { requireApiSession } from "@/lib/auth";
import { getResumeQueue } from "@/lib/queue";
export async function POST() {
  const unauthorized = await requireApiSession(); if (unauthorized) return unauthorized;
  await getResumeQueue().resume();
  return Response.json({ paused: false });
}
