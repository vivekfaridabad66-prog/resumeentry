import { redirect } from "next/navigation";
import { Suspense } from "react";
import { session } from "@/lib/auth";
import WorkspaceShell from "./workspace-shell";

async function RequireSession({ children }: { children: React.ReactNode }) {
  const current = await session();
  if (!current) redirect("/login");
  return <WorkspaceShell account={{ email: current.email, role: current.role }}>{children}</WorkspaceShell>;
}

export default function WorkspaceLayout({ children }: LayoutProps<"/">) {
  return <Suspense fallback={<main className="tool-page workspace-loading" role="status">Loading workspace…</main>}><RequireSession>{children}</RequireSession></Suspense>;
}
