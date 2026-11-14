import type { Criterion } from "@/lib/game/exam";

// Final-exam criteria with pass/fail, shared by the result page and the demo.
export function CriteriaTable({ criteria, footer }: { criteria: Criterion[]; footer?: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-line bg-surface">
      <h2 className="border-b border-line px-4 py-2 font-mono text-xs text-muted">final exam · by criterion</h2>
      <ul className="divide-y divide-line font-mono text-sm">
        {criteria.map((c) => (
          <li key={c.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-2.5">
            <span className="text-muted">{c.label}</span>
            <span className="tabular-nums">{c.value}</span>
            <span className={c.passed ? "text-accent" : "text-warn"}>
              {c.passed ? "✓" : "✗"} {c.target}
            </span>
          </li>
        ))}
      </ul>
      {footer}
    </section>
  );
}
