"use client";

import { useRef, useState } from "react";

let logoutPending = false;

export default function SignOutButton({
  className = "button button-secondary",
  menuItem = false,
}: {
  className?: string;
  menuItem?: boolean;
}) {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    if (pending.current || logoutPending) return;
    pending.current = true;
    logoutPending = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Sign-out failed");
      window.location.replace("/login");
    } catch {
      setError("Could not sign out. Please try again.");
      pending.current = false;
      logoutPending = false;
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className={className}
        role={menuItem ? "menuitem" : undefined}
        disabled={busy && !menuItem}
        aria-disabled={busy}
        aria-busy={busy}
        onClick={() => void signOut()}
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <p className="ui-error sign-out-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
