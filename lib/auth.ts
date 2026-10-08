import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

const cookieName = "talentflow_session";
const configuredSecret = process.env.AUTH_SECRET;
function signingKey() {
  if (process.env.NODE_ENV === "production" && (!configuredSecret || configuredSecret.length < 32)) throw new Error("AUTH_SECRET must contain at least 32 characters in production.");
  return new TextEncoder().encode(configuredSecret ?? "development-only-change-me-before-deploying-32chars");
}

export async function createSession(email: string, role: string) {
  const token = await new SignJWT({ email, role }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("12h").sign(signingKey());
  const jar = await cookies();
  jar.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 12 });
}

export async function session() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try { return (await jwtVerify(token, signingKey())).payload as { email: string; role: string }; }
  catch { return null; }
}

export async function requireApiSession() {
  const current = await session();
  if (!current || current.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function clearSession() {
  (await cookies()).delete(cookieName);
}
