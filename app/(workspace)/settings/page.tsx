"use client";
import Link from "next/link";
import { useState } from "react";
export default function SettingsPage() {
  const [message, setMessage] = useState("");
  async function signOut() { await fetch("/api/auth/logout", { method: "POST" }); window.location.replace("/login"); }
  return <main className="tool-page"><div className="tool-header"><div><Link href="/" className="back-link">← Workspace</Link><h1>Workspace settings</h1><p>Security, extraction and processing configuration.</p></div></div><section className="tool-panel settings-panel"><div><h2>Admin access</h2><p>Access uses the administrator configured in environment settings. Sessions expire after 12 hours.</p><button className="button button-secondary" onClick={() => void signOut()}>Sign out</button></div><div><h2>Extraction settings</h2><p>Default review threshold: {process.env.NEXT_PUBLIC_CONFIDENCE_THRESHOLD ?? "75"}%</p><p>AI name and designation assistance: configured on the server</p><p>OCR: English language pack · private file storage</p></div><div><h2>Processing worker</h2><p>Concurrency and retries are configured using WORKER_CONCURRENCY and queue retry settings.</p><button className="button button-secondary" onClick={async () => { const response = await fetch("/api/processing/retry-failed", { method: "POST" }); setMessage(response.ok ? `${(await response.json()).retried} failed resumes re-queued.` : "Could not retry failed resumes."); }}>{message || "Retry failed resumes"}</button></div></section></main>;
}
