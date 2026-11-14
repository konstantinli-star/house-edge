import type { FinalSettlement } from "@/lib/game/pool";
import { formatUsd, KICKSTARTER } from "@/lib/game/rules";
import { Formula, Frac, Group, Name, Op, V } from "@/components/math/Math";

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
  // [symbol, meaning, value]: symbols typeset like the formula below.
  const rows: [React.ReactNode, string, string][] = [
    [null, `players (${s.winners} reached the goal)`, String(s.players)],
    [<Name key="b">Bank</Name>, "all stakes", formatUsd(s.bankCents)],
    [<V key="l" n="L" />, "stakes of players who missed", formatUsd(s.losersCents)],
    [<V key="s" n="S" sub="w" />, "stakes of winners", formatUsd(s.winnersCents)],
    [
      <Name key="c">Commission</Name>,
      `min(${ratePct}% · Bank, L)`,
      formatUsd(s.commissionCents),
    ],
    [
      <span key="n" className="whitespace-nowrap">
        <V n="L" /> − <Name>Commission</Name>
      </span>,
      "left for winners",
      formatUsd(net),
    ],
  ];

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-2">
        <h2 className="font-mono text-xs text-muted">payout · real formula</h2>
        <span className="rounded border border-warn/40 px-1.5 py-0.5 font-mono text-xs text-warn">Simulated pool</span>
      </div>
      <dl className="divide-y divide-line text-sm">
        {rows.map(([symbol, meaning, value]) => (
          <div key={meaning} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
            <dt className="flex flex-wrap items-baseline gap-x-3">
              {symbol && <span className="font-math text-base">{symbol}</span>}
              <span className="text-muted">{meaning}</span>
            </dt>
            <dd className="shrink-0 font-mono tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {won ? (
        <div className="flex flex-col gap-4 border-t border-line bg-bg px-4 py-5">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">your payout</p>
          <Formula className="text-lg sm:text-xl">
            <V n="s" />
            <Op>+</Op>
            <Frac num={<V n="s" />} den={<V n="S" sub="w" />} />
            <Group before={<Op>×</Op>}>
              <V n="L" />
              <Op>−</Op>
              <Name>Commission</Name>
            </Group>
          </Formula>
          <Formula className="text-lg tabular-nums sm:text-xl">
            {formatUsd(stakeCents)}
            <Op>+</Op>
            <Frac num={formatUsd(stakeCents)} den={formatUsd(s.winnersCents)} />
            <Op>×</Op>
            {formatUsd(net)}
            <Op>=</Op>
            <span className="font-semibold text-accent">{formatUsd(s.yourPayoutCents)}</span>
          </Formula>
        </div>
      ) : (
        <p className="border-t border-line px-4 py-3 text-sm">
          {p.status === "appeal_review"
            ? `Your ${formatUsd(stakeCents)} stays on hold until the review is done. An approved review pays out like a win.`
            : `Your ${formatUsd(stakeCents)} goes to the players who reached the goal. The fee never touches a winner’s own stake.`}
        </p>
      )}
    </section>
  );
}
