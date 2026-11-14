import Link from "next/link";
import { MetricLog, type LogRow } from "@/components/MetricLog";
import { TARGETS } from "@/lib/proof/score";
import type { TakeResult } from "@/hooks/useSpeechTake";

// Plain-language meaning for each metric, relative to the exam targets.
function rows({ metrics: m }: TakeResult): LogRow[] {
  const inBand = m.wpm >= TARGETS.paceMin && m.wpm <= TARGETS.paceMax;
  const topFillers = Object.entries(m.fillersByWord)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w, n]) => `${w} ×${n}`)
    .join(", ");

  const list: LogRow[] = [
    {
      label: "fillers/min",
      value: m.fillersPerMin.toFixed(1),
      note:
        m.fillersPerMin <= TARGETS.maxFillersPerMin
          ? `Clean. Target ≤ ${TARGETS.maxFillersPerMin}.${topFillers ? ` (${topFillers})` : ""}`
          : `Above the ≤ ${TARGETS.maxFillersPerMin} target: ${topFillers}${m.hesitationSource === "audio-estimate" ? " (um/uh estimated from audio)" : ""}`,
    },
    {
      label: "pace",
      value: `${m.wpm} wpm`,
      note: inBand
        ? `In the ${TARGETS.paceMin}–${TARGETS.paceMax} band. Easy to follow.`
        : m.wpm > TARGETS.paceMax
          ? `Too fast. Target ${TARGETS.paceMin}–${TARGETS.paceMax}: slow down and let points land.`
          : `Slow. Target ${TARGETS.paceMin}–${TARGETS.paceMax}: tighten your sentences.`,
    },
    {
      label: "pauses",
      value: `${m.pauses.count} · ${m.pauses.totalSec.toFixed(1)}s`,
      note:
        m.pauses.count === 0
          ? "No pauses over 0.7 s. A short pause after a key point helps it stick."
          : `Longest ${m.pauses.longestSec.toFixed(1)} s. Deliberate pauses read as confidence.`,
    },
  ];

  if (m.pitchVariabilitySt != null) {
    list.push({
      label: "vocal variety",
      value: `${m.pitchVariabilitySt.toFixed(1)} st`,
      note:
        m.pitchVariabilitySt < 1.5
          ? "Flat delivery. Vary your pitch to stress key words."
          : m.pitchVariabilitySt < 3
            ? "Some variety. Push the contrast on your main point."
            : "Lively, varied delivery.",
    });
  }
  list.push({ label: "words", value: String(m.words), note: `${m.speakingSec} s of speaking time` });
  return list;
}

export function ResultsLog({ topic, result, onAgain }: { topic: string; result: TakeResult; onAgain: () => void }) {
  const { metrics } = result;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Speaker Rating · provisional</p>
        <p className="font-mono text-6xl font-semibold tabular-nums text-accent">{metrics.rating}</p>
        <p className="text-sm text-muted">
          Composite {metrics.scores.composite}/100 from fillers, pace and vocal variety. Provisional until you add
          eye contact and two more takes in the full baseline.
        </p>
      </div>

      <MetricLog title={`baseline ~ ${topic}`} rows={rows(result)} />

      <div className="rounded-lg border border-line bg-surface p-4">
        <p className="mb-2 font-mono text-xs text-muted">
          transcript · {metrics.transcriptSource === "openai" ? "OpenAI speech-to-text" : "browser speech recognition"}
          {" · "}
          <mark className="rounded bg-warn/20 px-1 text-warn">fillers highlighted</mark>
        </p>
        <p className="text-sm leading-relaxed">
          {metrics.tokens.map((t, i) =>
            t.filler ? (
              <mark key={i} className="rounded bg-warn/20 px-0.5 text-warn">
                {t.text}{" "}
              </mark>
            ) : (
              <span key={i}>{t.text} </span>
            ),
          )}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onAgain}
          className="rounded-md bg-accent px-5 py-3 font-medium text-accent-ink hover:opacity-90"
        >
          Record again with a new topic
        </button>
        <Link href="/" className="rounded-md border border-line px-5 py-3 text-center font-medium hover:bg-raised">
          Back to home
        </Link>
      </div>
    </div>
  );
}
