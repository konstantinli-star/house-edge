"use client";

import { useEffect, useState } from "react";
import { formatUsd, KICKSTARTER } from "@/lib/game/rules";
import { guestAuthHeader, startGuest } from "@/lib/guest";
import {
  canLiftExclusion,
  changeLimit,
  isSelfExcluded,
  loadSafety,
  saveSafety,
  SELF_EXCLUSION_COOLING_DAYS,
  type SafetySettings,
} from "@/lib/safety";

// Personal stake limit + self-exclusion toggle.
export function SafetyControls() {
  const [s, setS] = useState<SafetySettings | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => setS(loadSafety()), []);
  if (!s) return null;

  const update = (next: SafetySettings) => {
    saveSafety(next);
    setS(next);
  };

  async function setExcluded(excluded: boolean) {
    setError("");
    setSaving(true);
    try {
      await startGuest();
      const res = await fetch("/api/player/self-exclusion", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await guestAuthHeader()) },
        body: JSON.stringify({ excluded }),
      });
      if (!res.ok) throw new Error();
      update({ ...s!, selfExcludedAt: excluded ? new Date().toISOString() : null });
    } catch {
      setError("Could not save the setting. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const excluded = isSelfExcluded(s);
  const liftAt = s.selfExcludedAt
    ? new Date(Date.parse(s.selfExcludedAt) + SELF_EXCLUSION_COOLING_DAYS * 86_400_000).toLocaleDateString("en-US")
    : "";

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
        <h2 className="font-mono text-sm text-accent">personal stake limit</h2>
        <p className="text-sm text-muted">Lowering takes effect now. Raising or removing it waits 24 hours.</p>
        <label htmlFor="stake-limit" className="text-sm">
          Highest stake I allow myself
        </label>
        <select
          id="stake-limit"
          value={s.stakeLimitCents ?? ""}
          onChange={(e) => update(changeLimit(s, e.target.value ? Number(e.target.value) : null))}
          className="rounded-md border border-line bg-bg px-3 py-2 text-sm"
        >
          <option value="">No personal limit (max {formatUsd(KICKSTARTER.tiersCents.at(-1)!)})</option>
          {KICKSTARTER.tiersCents.map((c) => (
            <option key={c} value={c}>
              {formatUsd(c)}
            </option>
          ))}
        </select>
        {s.pendingLimit && (
          <p className="text-xs text-warn">
            Change to {s.pendingLimit.cents ? formatUsd(s.pendingLimit.cents) : "no limit"} takes effect{" "}
            {new Date(s.pendingLimit.effectiveAt).toLocaleString("en-US")}.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
        <h2 className="font-mono text-sm text-accent">self-exclusion</h2>
        <p className="text-sm text-muted">
          Turns off stakes on your account. The free Speaker Rating, practice and demo stay available. Turning it off
          again needs a {SELF_EXCLUSION_COOLING_DAYS}-day pause.
        </p>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={excluded}
            disabled={saving || (excluded && !canLiftExclusion(s))}
            onChange={(e) => void setExcluded(e.target.checked)}
            className="size-4 accent-[var(--color-accent)]"
          />
          {saving ? "Saving…" : excluded ? "Stakes are off" : "Turn off stakes for my account"}
        </label>
        {excluded && !canLiftExclusion(s) && <p className="text-xs text-muted">You can turn stakes back on after {liftAt}.</p>}
        {error && (
          <p role="alert" className="text-xs text-warn">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
