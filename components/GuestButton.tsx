"use client";

import { useEffect, useState } from "react";
import { GUEST_EVENT, readGuest, shortId, startGuest, type GuestSession } from "@/lib/guest";

// "Try as guest": creates an anonymous session in one click.
export function GuestButton() {
  const [session, setSession] = useState<GuestSession | null>(null);
  const [loading, setLoading] = useState(false);

  // Also update when a session is started elsewhere (e.g. at checkout).
  useEffect(() => {
    const sync = () => setSession(readGuest());
    sync();
    window.addEventListener(GUEST_EVENT, sync);
    return () => window.removeEventListener(GUEST_EVENT, sync);
  }, []);

  async function onClick() {
    setLoading(true);
    try {
      setSession(await startGuest());
    } finally {
      setLoading(false);
    }
  }

  if (session) {
    return (
      <span
        className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-1.5 font-mono text-xs text-muted"
        title={`Guest session (${session.backend})`}
      >
        <span className="size-1.5 rounded-full bg-accent" aria-hidden />
        guest·{shortId(session.id)}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {loading ? "Starting…" : "Try as guest"}
    </button>
  );
}
