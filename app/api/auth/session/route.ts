import { session } from "@/lib/auth";
export async function GET() {
  const current = await session();
  return current ? Response.json({ email: current.email }) : Response.json({ error: "Unauthorized" }, { status: 401 });
}
