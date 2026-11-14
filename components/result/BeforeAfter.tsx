import type { Entry, ExamRecord } from "@/lib/game/entry";
import { TARGETS } from "@/lib/proof/score";

const PACE_MID = (TARGETS.paceMin + TARGETS.paceMax) / 2;

// Before (3-speech baseline) vs after (final exam), like a diff of two logs.
export function BeforeAfter({ entry, exam }: { entry: Entry; exam: ExamRecord }) {
  const b = entry.baseline;
  const x = exam.input;
  const rows = [
    { label: "fillers/min", before: b.fillersPerMin.toFixed(1), after: x.fillersPerMin.toFixed(1), better: x.fillersPerMin < b.fillersPerMin },
    { label: "pace", before: `${b.wpm} wpm`, after: `${x.wpm} wpm`, better: Math.abs(x.wpm - PACE_MID) < Math.abs(b.wpm - PACE_MID) },
    { label: "eye contact", before: "—", after: x.eyeContactPct == null ? "—" : `${x.eyeContactPct}%`, better: true },
    { label: "speaker rating", before: String(entry.goal.ratingFrom), after: String(exam.rating.after), better: exam.rating.after > entry.goal.ratingFrom },
  ];
  const gain = exam.rating.after - entry.goal.ratingFrom;
  const target = entry.goal.ratingTarget - entry.goal.ratingFrom;

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-surface">
      <h2 className="border-b border-line px-4 py-2 font-mono text-xs text-muted">before → after</h2>
      <table className="w-full font-mono text-sm">
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row" className="px-4 py-2.5 text-left font-normal text-muted">
                {r.label}
              </th>
              <td className="px-2 py-2.5 text-right tabular-nums">{r.before}</td>
              <td className="px-2 py-2.5 text-muted" aria-hidden>
                →
              </td>
              <td className={`px-4 py-2.5 tabular-nums ${r.better ? "text-accent" : ""}`}>{r.after}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line px-4 py-2.5 font-mono text-xs text-muted">
        rating {gain >= 0 ? "+" : ""}
        {gain} of +{target} target
      </p>
    </section>
  );
}
