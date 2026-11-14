"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Entry } from "@/lib/game/entry";
import { saveEntry, saveTakes } from "@/lib/game/progress";
import { EntrySummary } from "./EntrySummary";
import { TestModeBanner } from "./TestModeBanner";

// After Stripe redirects back: verify the test payment on the server, then keep the entry.
export function ConfirmEntry() {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) return setError("Missing checkout session.");

    fetch(`/api/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (res) => {
        const data = (await res.json()) as { entry?: Entry; error?: string };
        if (!res.ok || !data.entry) throw new Error(data.error ?? "We couldn’t confirm your entry.");
        saveEntry(data.entry);
        saveTakes([]); // the next game needs a fresh baseline
        setEntry(data.entry);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <TestModeBanner />
      {entry ? (
        <EntrySummary entry={entry} />
      ) : error ? (
        <div role="alert" className="flex flex-col gap-3 rounded-lg border border-warn/40 bg-surface p-5">
          <p className="text-warn">{error}</p>
          <Link href="/play" className="w-fit text-sm text-accent hover:underline">
            Back to stakes
          </Link>
        </div>
      ) : (
        <p className="font-mono text-sm text-muted">confirming your test payment…</p>
      )}
    </div>
  );
}
