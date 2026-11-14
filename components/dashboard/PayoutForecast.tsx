import { payoutForecast, PROJECTED_FINISH_RATE, simulatedPool } from "@/lib/game/pool";
import { formatUsd, KICKSTARTER } from "@/lib/game/rules";

const GAME = "kickstarter-2026-11";

// Live "if you finish" forecast, computed with the real payout function.
type Props = { day: number; stakeCents: number; onTrack: boolean; commissionRate?: number };

export function PayoutForecast({ day, stakeCents, onTrack, commissionRate = KICKSTARTER.commissionRate }: Props) {
  const f = payoutForecast(simulatedPool(GAME), day, { stakeCents }, commissionRate);
  const share = f.payoutCents - f.stakeCents;

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-mono text-sm text-accent">payout forecast</h2>
        <span className="rounded border border-warn/40 px-1.5 py-0.5 font-mono text-xs text-warn">Simulated pool</span>
      </div>
      <p className="text-sm text-muted">{onTrack ? "On track to win:" : "If you get back on track and finish:"}</p>
      <p className="font-mono text-4xl font-semibold tabular-nums">{formatUsd(f.payoutCents)}</p>
      <p className="font-mono text-xs text-muted">
        your {formatUsd(f.stakeCents)} back + {formatUsd(share)} share
      </p>
      <dl className="grid grid-cols-3 gap-2 border-t border-line pt-3 font-mono text-xs">
        <div>
          <dt className="text-muted">players</dt>
          <dd>{f.active} of {f.players} still in</dd>
        </div>
        <div>
          <dt className="text-muted">bank</dt>
          <dd>{formatUsd(f.bankCents)}</dd>
        </div>
        <div>
          <dt className="text-muted">our fee</dt>
          <dd>{formatUsd(f.commissionCents)}</dd>
        </div>
      </dl>
      <p className="text-xs text-muted">
        Assumes about {PROJECTED_FINISH_RATE * 100}% of players finish. {commissionRate === 0 ? "No fee in your subscriber game; everything" : `Our ${commissionRate * 100}% fee comes only from the stakes of players who don’t; the rest`} goes to the players who finish. Test mode. No real money moves.
      </p>
    </section>
  );
}
