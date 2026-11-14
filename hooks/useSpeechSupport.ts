"use client";

import { useEffect, useState } from "react";
import { hasWebSpeech } from "@/lib/speech/captions";
import { canRecord } from "@/lib/speech/recorder";

export type SpeechSupport = "checking" | "ok" | "no-mic" | "no-transcript";

// Can this browser record and get a transcript (browser captions or server STT)?
export function useSpeechSupport(): SpeechSupport {
  const [support, setSupport] = useState<SpeechSupport>("checking");

  useEffect(() => {
    if (!canRecord()) return setSupport("no-mic");
    if (hasWebSpeech()) return setSupport("ok");
    fetch("/api/health")
      .then((r) => r.json())
      .then((h) => setSupport(h.configured?.openai ? "ok" : "no-transcript"))
      .catch(() => setSupport("no-transcript"));
  }, []);

  return support;
}
