"use client";

import { useState } from "react";

// 18+ confirmation, required before any stake screen.
export function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
      <h2 className="text-xl font-semibold">Before you choose a stake</h2>
      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 size-4 accent-[var(--color-accent)]"
        />
        <span>I confirm I am 18 or older.</span>
      </label>
      <p className="text-sm text-muted">Availability depends on your state. Demo runs in test mode.</p>
      <button
        type="button"
        onClick={onConfirm}
        disabled={!checked}
        className="w-fit rounded-md bg-accent px-5 py-2.5 font-medium text-accent-ink hover:opacity-90 disabled:opacity-50"
      >
        Continue to stakes
      </button>
    </div>
  );
}
