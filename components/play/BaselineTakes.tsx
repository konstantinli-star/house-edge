"use client";

import { useEffect, useState } from "react";
import { saveAttempt, withoutTokens } from "@/lib/attempts";
import type { TakeSummary } from "@/lib/game/baseline";
import { loadTakes, saveTakes } from "@/lib/game/progress";
import { KICKSTARTER } from "@/lib/game/rules";
import { checkLiveness, randomPhrase } from "@/lib/proof/liveness";
import type { SpeechMetrics } from "@/lib/proof/metrics";
import { randomTopic } from "@/lib/topics";
import { useSpeechSupport } from "@/hooks/useSpeechSupport";
import { useSpeechTake } from "@/hooks/useSpeechTake";
import { LIMIT_SEC, MIN_SEC } from "@/components/baseline/BaselineFlow";
import { Notice, UnsupportedNotice } from "@/components/baseline/Notice";
import { RecordingPanel } from "@/components/baseline/RecordingPanel";

const TOTAL = KICKSTARTER.baselineTakes;

export const toTakeSummary = (m: SpeechMetrics): TakeSummary => ({
  fillersPerMin: m.fillersPerMin,
  wpm: m.wpm,
  pitchVariabilitySt: m.pitchVariabilitySt,
  pausesPerMin: Math.round((m.pauses.count / Math.max(m.speakingSec / 60, 0.1)) * 10) / 10,
});

// Records 3 timed speeches, each opened by a random liveness phrase.
export function BaselineTakes({ onComplete }: { onComplete: (takes: TakeSummary[]) => void }) {
  const support = useSpeechSupport();
  const take = useSpeechTake(LIMIT_SEC);
  const [takes, setTakes] = useState<TakeSummary[]>([]);
  const [prompt, setPrompt] = useState({ topic: "", phrase: "" });
  const [livenessOk, setLivenessOk] = useState(true);

  // Resume progress after a refresh; random prompts only on the client.
  useEffect(() => {
    setTakes(loadTakes().slice(0, TOTAL));
    setPrompt({ topic: randomTopic(), phrase: randomPhrase() });
  }, []);

  // Each finished take: check liveness, store the attempt and the summary.
  useEffect(() => {
    if (take.phase !== "done" || !take.result) return;
    const { metrics, transcript } = take.result;
    const liveness = checkLiveness(prompt.phrase, transcript);
    setLivenessOk(liveness.passed);
    saveAttempt({
      id: crypto.randomUUID(),
      kind: "baseline",
      topic: prompt.topic,
      phrase: prompt.phrase,
      transcript,
      metrics: withoutTokens(metrics),
      flags: liveness.passed ? {} : { livenessPhraseMissing: true },
      createdAt: new Date().toISOString(),
    });
    setTakes((prev) => {
      const next = [...prev, toTakeSummary(metrics)].slice(0, TOTAL);
      saveTakes(next);
      return next;
    });
  }, [take.phase, take.result, prompt]);

  const nextTake = () => {
    setPrompt((p) => ({ topic: randomTopic(p.topic), phrase: randomPhrase() }));
    take.reset();
  };

  if (support === "no-mic" || support === "no-transcript") return <UnsupportedNotice support={support} />;

  const header = (
    <div className="flex items-center gap-3">
      {Array.from({ length: TOTAL }, (_, i) => (
        <span key={i} className={`h-1.5 flex-1 rounded-full ${i < takes.length ? "bg-accent" : "bg-line"}`} />
      ))}
      <span className="font-mono text-xs text-muted">
        {Math.min(takes.length + (take.phase === "done" ? 0 : 1), TOTAL)}/{TOTAL}
      </span>
    </div>
  );

  if (takes.length >= TOTAL && take.phase !== "recording") {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <TakeDone takes={takes} livenessOk={livenessOk} />
        <button
          type="button"
          onClick={() => onComplete(takes)}
          className="rounded-md bg-accent px-5 py-3 font-medium text-accent-ink hover:opacity-90"
        >
          See my goal
        </button>
      </div>
    );
  }

  if (take.phase === "done" && take.result) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <TakeDone takes={takes.slice(-1)} livenessOk={livenessOk} />
        <button
          type="button"
          onClick={nextTake}
          className="rounded-md bg-accent px-5 py-3 font-medium text-accent-ink hover:opacity-90"
        >
          Next speech ({takes.length + 1} of {TOTAL})
        </button>
      </div>
    );
  }

  if (take.phase === "denied" || take.phase === "error") {
    return (
      <Notice
        title={take.phase === "denied" ? "Microphone access is blocked" : "We couldn’t score that take"}
        action={{ label: "Try again", onClick: nextTake }}
      >
        {take.phase === "denied"
          ? "Allow the microphone for this site (the icon in your address bar), then try again."
          : take.error}
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {header}
      <RecordingPanel
        topic={prompt.topic}
        phrase={prompt.phrase}
        phase={take.phase}
        elapsed={take.elapsed}
        limitSec={LIMIT_SEC}
        minSec={MIN_SEC}
        level={take.level}
        captions={take.captions}
        onShuffle={() => setPrompt((p) => ({ ...p, topic: randomTopic(p.topic) }))}
        onStart={take.start}
        onFinish={take.finish}
        disabled={support === "checking" || !prompt.topic}
      />
    </div>
  );
}

function TakeDone({ takes, livenessOk }: { takes: TakeSummary[]; livenessOk: boolean }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4 font-mono text-sm">
      {takes.map((t, i) => (
        <p key={i}>
          <span className="text-muted">take ›</span> {t.fillersPerMin.toFixed(1)} fillers/min · {t.wpm} wpm ·{" "}
          {t.pausesPerMin.toFixed(1)} pauses/min
        </p>
      ))}
      {!livenessOk && (
        <p className="text-warn">
          Flagged: we didn’t hear the opening phrase. The take still counts; flagged takes can be reviewed.
        </p>
      )}
    </div>
  );
}
