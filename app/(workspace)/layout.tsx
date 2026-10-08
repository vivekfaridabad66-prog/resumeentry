import { redirect } from "next/navigation";
import { Suspense } from "react";
import { session } from "@/lib/auth";

async function RequireSession({ children }: { children: React.ReactNode }) {
  if (!(await session())) redirect("/login");
  return children;
}

export default function WorkspaceLayout({ children }: LayoutProps<"/">) {
  return <Suspense fallback={<main className="tool-page">Loading workspace…</main>}><RequireSession>{children}</RequireSession></Suspense>;
}
