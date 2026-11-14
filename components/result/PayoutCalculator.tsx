"use client";

import { useState } from "react";
import { OPEN_GAME_COMMISSION, settlePool, SUBSCRIBER_COMMISSION } from "@/lib/game/payout";
import { formatUsd } from "@/lib/game/rules";

// What-if calculator: 100 players × $100, choose how many reach the goal.
export function PayoutCalculator() {
  const [winPct, setWinPct] = useState(70);
  const [subscriber, setSubscriber] = useState(false);
  const players = Array.from({ length: 100 }, (_, i) => ({ id: `p${i}`, stakeCents: 10000, won: i < winPct }));
  const s = settlePool(players, subscriber ? SUBSCRIBER_COMMISSION : OPEN_GAME_COMMISSION);
  const payout = s.payouts.p0;

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
      <h2 className="font-mono text-sm text-accent">payout calculator · 100 players × $100</h2>
      <label className="flex flex-col gap-2 text-sm">
        <span className="flex justify-between">
          <span className="text-muted">players who reach the goal</span>
          <span className="font-mono">{winPct}%</span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={winPct}
          onChange={(e) => setWinPct(Number(e.target.value))}
          className="accent-[var(--color-accent)]"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={subscriber}
          onChange={(e) => setSubscriber(e.target.checked)}
          className="size-4 accent-[var(--color-accent)]"
        />
        Subscriber game (0% commission)
      </label>
      <dl className="grid grid-cols-3 gap-2 font-mono text-sm">
        <Stat label="winner gets" value={payout === undefined ? "—" : formatUsd(payout)} accent />
        <Stat label="our fee" value={formatUsd(s.commissionCents)} />
        <Stat label="rolls over" value={formatUsd(s.rolloverCents)} />
      </dl>
      <p className="text-xs text-muted">
        Our fee is capped by the losers’ money, so it falls to $0 as almost everyone wins. If nobody wins, the whole bank
        rolls over to the next game.
      </p>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-line bg-bg px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`mt-0.5 text-lg tabular-nums ${accent ? "text-accent" : ""}`}>{value}</dd>
    </div>
  );
}
