import { Formula, Frac, Group, Name, Op, V } from "@/components/math/Math";

const ROWS = [
  {
    label: "bank",
    formula: (
      <>
        <Name>Bank</Name>
        <Op>=</Op>
        <V n="L" />
        <Op>+</Op>
        <V n="S" sub="w" />
      </>
    ),
  },
  {
    label: "our fee",
    formula: (
      <>
        <Name>Commission</Name>
        <Op>=</Op>
        <Name>min</Name>
        <Group>
          <V n="f" />
          <Op>·</Op>
          <Name>Bank</Name>,&nbsp;<V n="L" />
        </Group>
      </>
    ),
  },
  {
    label: "your payout",
    formula: (
      <>
        <Name>Payout</Name>
        <sub className="text-[0.65em]">
          <i>i</i>
        </sub>
        <Op>=</Op>
        <V n="s" sub="i" />
        <Op>+</Op>
        <Frac num={<V n="s" sub="i" />} den={<V n="S" sub="w" />} />
        <Group before={<Op>×</Op>}>
          <V n="L" />
          <Op>−</Op>
          <Name>Commission</Name>
        </Group>
      </>
    ),
  },
];

const LEGEND: [React.ReactNode, string][] = [
  [<V key="L" n="L" />, "stakes of players who missed the goal"],
  [<V key="S" n="S" sub="w" />, "stakes of players who reached it"],
  [<V key="s" n="s" sub="i" />, "your stake"],
  [<V key="f" n="f" />, "15% in an open game, 0% for subscribers"],
];

// The payout rules, typeset as formulas with real fractions.
export function PayoutFormulas() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <ol className="divide-y divide-line">
        {ROWS.map((r) => (
          <li key={r.label} className="flex flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
            <span className="w-28 shrink-0 font-mono text-xs uppercase tracking-widest text-muted">{r.label}</span>
            <Formula className="flex-1 text-base min-[400px]:text-lg sm:justify-start sm:text-2xl">{r.formula}</Formula>
          </li>
        ))}
      </ol>
      <dl className="grid gap-x-6 gap-y-2 border-t border-line bg-bg px-4 py-4 text-sm sm:grid-cols-2 sm:px-6">
        {LEGEND.map(([symbol, meaning]) => (
          <div key={meaning} className="flex items-baseline gap-3">
            <dt className="w-8 shrink-0 text-right font-math text-lg">{symbol}</dt>
            <dd className="text-muted">{meaning}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
