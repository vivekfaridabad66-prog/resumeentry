import { clearSession, requireApiSession } from "@/lib/auth";
export async function POST() {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;
  await clearSession();
  return Response.json({ ok: true });
}
