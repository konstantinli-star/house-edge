import type { FinalSettlement } from "@/lib/game/pool";
import { formatUsd, KICKSTARTER } from "@/lib/game/rules";

// The real formula with this game's numbers filled in.
export function PayoutBreakdown(p: {
  s: FinalSettlement;
  stakeCents: number;
  status: "won" | "lost" | "appeal_review" | "active";
  commissionRate?: number;
}) {
  const ratePct = Math.round((p.commissionRate ?? KICKSTARTER.commissionRate) * 100);
  const { s, stakeCents } = p;
  const won = p.status === "won";
  const net = s.losersCents - s.commissionCents;
  const rows = [
    ["players", `${s.players} (${s.winners} reached the goal)`],
    ["bank = all stakes", formatUsd(s.bankCents)],
    ["L = stakes of players who missed", formatUsd(s.losersCents)],
    ["S_w = stakes of winners", formatUsd(s.winnersCents)],
    [`commission = min(${ratePct}% × bank, L)`, formatUsd(s.commissionCents)],
    ["left for winners = L − commission", formatUsd(net)],
  ];

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-2">
        <h2 className="font-mono text-xs text-muted">payout · real formula</h2>
        <span className="rounded border border-warn/40 px-1.5 py-0.5 font-mono text-xs text-warn">Simulated pool</span>
      </div>
      <dl className="divide-y divide-line font-mono text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-2">
            <dt className="text-muted">{label}</dt>
            <dd className="tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-line px-4 py-3 font-mono text-sm">
        {won ? (
          <>
            your payout = s + (s / S_w) × (L − commission) = {formatUsd(stakeCents)} + ({formatUsd(stakeCents)} /{" "}
            {formatUsd(s.winnersCents)}) × {formatUsd(net)} ={" "}
            <span className="text-accent">{formatUsd(s.yourPayoutCents)}</span>
          </>
        ) : p.status === "appeal_review" ? (
          <>Your {formatUsd(stakeCents)} stays on hold until the review is done. An approved review pays out like a win.</>
        ) : (
          <>Your {formatUsd(stakeCents)} goes to the players who reached the goal. The fee never touches a winner’s own stake.</>
        )}
      </p>
    </section>
  );
}
