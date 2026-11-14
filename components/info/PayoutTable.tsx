import { OPEN_GAME_COMMISSION, settlePool, SUBSCRIBER_COMMISSION } from "@/lib/game/payout";
import { formatUsd } from "@/lib/game/rules";

const SHARES = [50, 60, 70, 75, 80, 85, 90, 100];

// 100 players × $100, computed with the real payout function at build time.
export function PayoutTable() {
  const rows = SHARES.map((pct) => {
    const players = Array.from({ length: 100 }, (_, i) => ({ id: `p${i}`, stakeCents: 10000, won: i < pct }));
    const open = settlePool(players, OPEN_GAME_COMMISSION);
    const sub = settlePool(players, SUBSCRIBER_COMMISSION);
    return { pct, commission: open.commissionCents, open: open.payouts.p0, sub: sub.payouts.p0 };
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full min-w-[30rem] font-mono text-sm">
        <caption className="border-b border-line px-4 py-2 text-left text-xs text-muted">
          100 players × $100 · bank $10,000
        </caption>
        <thead>
          <tr className="text-left text-xs text-muted">
            <th scope="col" className="px-4 py-2 font-normal">reach the goal</th>
            <th scope="col" className="px-4 py-2 font-normal">our fee</th>
            <th scope="col" className="px-4 py-2 font-normal">winner gets</th>
            <th scope="col" className="px-4 py-2 font-normal">subscriber gets</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.pct} className={r.pct >= 60 && r.pct <= 75 ? "bg-raised" : ""}>
              <td className="px-4 py-2">{r.pct}%</td>
              <td className="px-4 py-2 tabular-nums">{formatUsd(r.commission)}</td>
              <td className="px-4 py-2 tabular-nums text-accent">{formatUsd(r.open)}</td>
              <td className="px-4 py-2 tabular-nums">{formatUsd(r.sub)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
