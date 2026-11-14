import { EXAM } from "@/lib/game/exam";
import { KICKSTARTER } from "@/lib/game/rules";

// Thresholds and rules shown before the exam starts.
export function ExamIntro({ practiceDays, onNext }: { practiceDays: number; onNext: () => void }) {
  const t = KICKSTARTER.exam;
  const rows = [
    ["fillers/min", `≤ ${t.maxFillersPerMin}`],
    ["eye contact", `≥ ${t.minEyeContactPct}%`],
    ["pace", `${t.paceMin}–${t.paceMax} wpm`],
    ["speaking time", `≥ ${EXAM.minSec} s of ${EXAM.limitSec} s`],
    ["practice days", `≥ ${KICKSTARTER.minPracticeDays} of ${KICKSTARTER.days} (you: ${practiceDays})`],
  ];

  return (
    <div className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-lg border border-line bg-surface">
        <h2 className="border-b border-line px-4 py-2 font-mono text-xs text-muted">to win, all of these must pass</h2>
        <table className="w-full font-mono text-sm">
          <tbody className="divide-y divide-line">
            {rows.map(([label, target]) => (
              <tr key={label}>
                <th scope="row" className="px-4 py-2.5 text-left font-normal text-muted">
                  {label}
                </th>
                <td className="px-4 py-2.5 text-accent">{target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-line bg-surface p-5 text-sm">
        <h2 className="font-mono text-sm text-accent">how the exam works</h2>
        <ul className="mt-3 flex flex-col gap-2">
          <li>› Fullscreen, camera and microphone. Video stays on your device; only the eye-contact % is kept.</li>
          <li>› Read the opening phrase aloud, then speak on a random topic for up to {EXAM.limitSec} seconds.</li>
          <li>› Leaving the tab, exiting fullscreen or another face in view is flagged. A flagged win goes to review.</li>
          <li>› One attempt. If something serious went wrong, you can file one appeal.</li>
        </ul>
      </section>

      <p className="rounded-md border border-warn/40 bg-warn/10 px-4 py-2 text-sm text-warn">
        In a real game the exam opens on day {KICKSTARTER.days}. In this test-mode build you can take it now; your
        practice days count as they are.
      </p>

      <button
        type="button"
        onClick={onNext}
        className="rounded-md bg-accent px-5 py-3 font-medium text-accent-ink hover:opacity-90"
      >
        Check camera and microphone
      </button>
    </div>
  );
}
