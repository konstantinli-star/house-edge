import type { DemoDay } from "@/lib/demo/jake";

// What Jake did on one day: his last task, with fillers highlighted in the transcript.
export function DemoDayCard({ day }: { day: DemoDay }) {
  const last = day.tasks.at(-1);
  if (!last) {
    return (
      <section className="flex min-h-56 flex-col gap-2 rounded-lg border border-line bg-surface p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">day {day.day} · no practice</p>
        <h2 className="text-xl font-semibold">Missed day</h2>
        <p className="text-sm text-muted">
          Life happens. No penalty and no shame: the weekly goal shows what he can still recover.
        </p>
      </section>
    );
  }

  const { task, metrics: m, change } = last;
  // Start the excerpt a little before the first filler, so highlights are visible.
  const firstFiller = Math.max(0, m.tokens.findIndex((t) => t.filler));
  const from = Math.max(0, firstFiller - 8);
  const excerpt = m.tokens.slice(from, from + 34);
  return (
    <section className="flex min-h-56 flex-col gap-3 rounded-lg border border-line bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          day {day.day} · {day.tasks.length} tasks · {task.title}
        </p>
        <span className="font-mono text-xs text-muted">difficulty {task.difficulty}</span>
      </div>
      <p className="text-sm font-medium">Practising his sprint demo · {task.instruction}</p>
      <p className="font-mono text-xs leading-relaxed text-muted">
        {from > 0 && "… "}
        {excerpt.map((t, i) =>
          t.filler ? (
            <mark key={i} className="rounded bg-warn/20 px-0.5 text-warn">
              {t.text}{" "}
            </mark>
          ) : (
            <span key={i}>{t.text} </span>
          ),
        )}
        …
      </p>
      <dl className="mt-auto grid grid-cols-3 gap-2 font-mono text-sm">
        <Stat label="fillers/min" value={m.fillersPerMin.toFixed(1)} />
        <Stat label="pace" value={`${m.wpm} wpm`} />
        <Stat
          label="rating"
          value={`${change.delta >= 0 ? "+" : ""}${change.delta}`}
          tone={change.delta >= 0 ? "text-accent" : "text-warn"}
        />
      </dl>
    </section>
  );
}

function Stat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md border border-line bg-bg px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`mt-0.5 tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
}
