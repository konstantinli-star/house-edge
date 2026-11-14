// Results shown like a developer's log. Pure presentational component.

export type LogRow = { label: string; value: string; note: string };

export function MetricLog({ title, badge, rows }: { title: string; badge?: string; rows: LogRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2 font-mono text-xs text-muted">
        <span>{title}</span>
        {badge && (
          <span className="rounded border border-warn/40 px-1.5 py-0.5 text-warn">{badge}</span>
        )}
      </div>
      <dl className="divide-y divide-line font-mono text-sm">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[1fr_auto] gap-x-4 px-4 py-2.5 sm:grid-cols-[10rem_6rem_1fr]">
            <dt className="text-muted">{row.label}</dt>
            <dd className="text-right tabular-nums sm:text-left">{row.value}</dd>
            <dd className="col-span-2 text-xs text-muted sm:col-span-1 sm:text-sm">{row.note}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
