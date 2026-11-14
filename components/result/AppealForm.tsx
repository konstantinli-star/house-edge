"use client";

import { useState } from "react";
import type { Entry } from "@/lib/game/entry";
import { saveEntry } from "@/lib/game/progress";
import { appealEntry, APPEAL_REASONS } from "@/lib/game/settle";
import { guestAuthHeader } from "@/lib/guest";

// One appeal per game. Approved appeals count as a win.
export function AppealForm({ entry, onChange }: { entry: Entry; onChange: (e: Entry) => void }) {
  const [reason, setReason] = useState<string>(APPEAL_REASONS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const updated = await appealEntry(entry, reason, guestAuthHeader);
      saveEntry(updated);
      onChange(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not file the appeal.");
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
      <h2 className="font-mono text-sm text-accent">appeal · 1 per game</h2>
      <p className="text-sm text-muted">
        If something outside your control got in the way, ask for a review. An approved appeal counts as a win.
      </p>
      <label htmlFor="appeal-reason" className="text-sm">
        Reason
      </label>
      <select
        id="appeal-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="rounded-md border border-line bg-bg px-3 py-2 text-sm"
      >
        {APPEAL_REASONS.map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-sm text-warn">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="w-fit rounded-md border border-line px-4 py-2 text-sm hover:bg-raised disabled:opacity-60"
      >
        {busy ? "Sending…" : "Request a review"}
      </button>
    </section>
  );
}
