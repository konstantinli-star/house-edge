"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { latestEntry } from "@/lib/game/progress";

// Shown on game screens when there is no active stake; links the last result if any.
export function EmptyGame() {
  const [lastResultId, setLastResultId] = useState<string | null>(null);
  useEffect(() => {
    const last = latestEntry();
    if (last?.exam) setLastResultId(last.id);
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-6">
      <h2 className="text-xl font-semibold">No active game</h2>
      <p className="text-sm text-muted">
        Set your goal with a 3-speech baseline and commit a stake in test mode. Your daily tasks, streak and rating
        chart live here once you’re in.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/play"
          className="w-fit rounded-md bg-accent px-5 py-2.5 font-medium text-accent-ink hover:opacity-90"
        >
          Start a Kickstarter game
        </Link>
        {lastResultId && (
          <Link
            href={`/result/${encodeURIComponent(lastResultId)}`}
            className="w-fit rounded-md border border-line px-5 py-2.5 font-medium hover:bg-raised"
          >
            See your last result
          </Link>
        )}
      </div>
    </div>
  );
}
