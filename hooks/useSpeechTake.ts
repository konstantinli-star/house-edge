"use client";

// One timed speech "take": mic permission → recording with live captions and
// level meter → on-device analysis + server transcript → metrics.

import { useCallback, useEffect, useRef, useState } from "react";
import { computeMetrics, NotEnoughSpeechError, type SpeechMetrics } from "@/lib/proof/metrics";
import { analyzeSamples } from "@/lib/proof/prosody";
import { startCaptions, type Captions } from "@/lib/speech/captions";
import { ANALYSIS_SAMPLE_RATE, decodeToMono16k } from "@/lib/speech/decode";
import { startRecording, type Recording } from "@/lib/speech/recorder";
import { transcribeOnServer } from "@/lib/speech/transcribe";

export type TakePhase = "idle" | "requesting" | "denied" | "recording" | "analyzing" | "done" | "error";

export type TakeResult = { metrics: SpeechMetrics; transcript: string };

export function useSpeechTake(limitSec: number) {
  const [phase, setPhase] = useState<TakePhase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [captions, setCaptions] = useState({ final: "", interim: "" });
  const [result, setResult] = useState<TakeResult | null>(null);
  const [error, setError] = useState("");

  const recording = useRef<Recording | null>(null);
  const live = useRef<Captions | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const startedAt = useRef(0);

  const clearTimers = () => window.clearInterval(timer.current);

  const finish = useCallback(async () => {
    const rec = recording.current;
    if (!rec) return;
    recording.current = null;
    clearTimers();
    setPhase("analyzing");

    try {
      const [blob, browserText] = await Promise.all([rec.stop(), live.current?.stop() ?? Promise.resolve("")]);
      const [samples, serverText] = await Promise.all([decodeToMono16k(blob), transcribeOnServer(blob)]);
      const transcript = serverText ?? browserText;
      if (!transcript) throw new NotEnoughSpeechError();

      const prosody = analyzeSamples(samples, ANALYSIS_SAMPLE_RATE);
      const metrics = computeMetrics(transcript, serverText ? "openai" : "web-speech", prosody);
      setResult({ metrics, transcript });
      setPhase("done");
    } catch (e) {
      setError(
        e instanceof NotEnoughSpeechError
          ? e.message
          : "Something went wrong while analysing your speech. Please record again.",
      );
      setPhase("error");
    }
  }, []);

  const start = useCallback(async () => {
    setPhase("requesting");
    setError("");
    setResult(null);
    setCaptions({ final: "", interim: "" });

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      setPhase("denied");
      return;
    }

    recording.current = await startRecording(stream);
    live.current = startCaptions((final, interim) => setCaptions({ final, interim }));
    startedAt.current = performance.now();
    setElapsed(0);
    setPhase("recording");

    timer.current = window.setInterval(() => {
      const sec = (performance.now() - startedAt.current) / 1000;
      setElapsed(sec);
      setLevel(recording.current?.level() ?? 0);
      if (sec >= limitSec) void finish();
    }, 100);
  }, [finish, limitSec]);

  const reset = useCallback(() => {
    recording.current?.cancel();
    recording.current = null;
    void live.current?.stop();
    clearTimers();
    setPhase("idle");
    setResult(null);
  }, []);

  // Release the mic if the user navigates away mid-recording.
  useEffect(() => () => {
    clearTimers();
    recording.current?.cancel();
  }, []);

  return { phase, elapsed, level, captions, result, error, start, finish, reset };
}
