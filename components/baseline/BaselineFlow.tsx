"use client";

import { useEffect, useState } from "react";
import { saveAttempt, withoutTokens } from "@/lib/attempts";
import { randomTopic } from "@/lib/topics";
import { useSpeechSupport } from "@/hooks/useSpeechSupport";
import { useSpeechTake } from "@/hooks/useSpeechTake";
import { RecordingPanel } from "./RecordingPanel";
import { ResultsLog } from "./ResultsLog";
import { Notice, UnsupportedNotice } from "./Notice";

export const LIMIT_SEC = 60;
export const MIN_SEC = 15;

export function BaselineFlow() {
  const [topic, setTopic] = useState("");
  const support = useSpeechSupport();
  const take = useSpeechTake(LIMIT_SEC);

  // Pick the topic on the client only (random, so it must not render on the server).
  useEffect(() => setTopic(randomTopic()), []);

  // Save each finished attempt (transcript + metrics, never audio).
  useEffect(() => {
    if (take.phase !== "done" || !take.result) return;
    saveAttempt({
      id: crypto.randomUUID(),
      kind: "quick-baseline",
      topic,
      transcript: take.result.transcript,
      metrics: withoutTokens(take.result.metrics),
      createdAt: new Date().toISOString(),
    });
  }, [take.phase, take.result, topic]);

  const again = () => {
    setTopic((t) => randomTopic(t));
    take.reset();
  };

  if (support === "no-mic" || support === "no-transcript") return <UnsupportedNotice support={support} />;

  if (take.phase === "done" && take.result) {
    return <ResultsLog topic={topic} result={take.result} onAgain={again} />;
  }

  if (take.phase === "denied") {
    return (
      <Notice title="Microphone access is blocked" action={{ label: "Try again", onClick: take.start }}>
        Allow the microphone for this site (the icon in your address bar), then try again. Your audio is analysed and
        discarded; we never store recordings.
      </Notice>
    );
  }

  if (take.phase === "error") {
    return (
      <Notice title="We couldn’t score that take" action={{ label: "Record again", onClick: again }}>
        {take.error}
      </Notice>
    );
  }

  return (
    <RecordingPanel
      topic={topic}
      phase={take.phase}
      elapsed={take.elapsed}
      limitSec={LIMIT_SEC}
      minSec={MIN_SEC}
      level={take.level}
      captions={take.captions}
      onShuffle={() => setTopic((t) => randomTopic(t))}
      onStart={take.start}
      onFinish={take.finish}
      disabled={support === "checking"}
    />
  );
}
