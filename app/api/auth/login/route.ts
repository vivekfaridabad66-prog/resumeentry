import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";

const inputSchema = z.object({ email: z.string().email(), password: z.string().min(1).max(256) });

export async function POST(request: Request) {
  const input = inputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Enter a valid email and password." }, { status: 400 });
  try {
    const email = input.data.email.toLowerCase();
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.isActive || user.role !== "ADMIN" || !(await bcrypt.compare(input.data.password, user.passwordHash))) return Response.json({ error: "Invalid credentials." }, { status: 401 });
    await createSession(user.email, user.role);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin login failed:", error);
    return Response.json({ error: "Login is temporarily unavailable. Restart the app and try again." }, { status: 500 });
  }
}
