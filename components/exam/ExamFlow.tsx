"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { saveAttempt, withoutTokens } from "@/lib/attempts";
import { EXAM, EXAM_DIFFICULTY, EXAM_TASK, type ExamFlags, type ExamInput } from "@/lib/game/exam";
import { addRecord } from "@/lib/game/journal";
import { saveEntry } from "@/lib/game/progress";
import { performanceScore, rateAttempt } from "@/lib/game/rating";
import { settleEntry } from "@/lib/game/settle";
import { guestAuthHeader } from "@/lib/guest";
import { checkLiveness, randomPhrase } from "@/lib/proof/liveness";
import { randomTopic } from "@/lib/topics";
import { eyeContactPct, faceMissingShare } from "@/lib/vision/gaze";
import { useGame } from "@/hooks/useGame";
import { useGazeTracker } from "@/hooks/useGazeTracker";
import { useSpeechTake } from "@/hooks/useSpeechTake";
import { Notice } from "@/components/baseline/Notice";
import { RecordingPanel } from "@/components/baseline/RecordingPanel";
import { EmptyGame } from "@/components/EmptyGame";
import { CameraView } from "./CameraView";
import { ExamIntro } from "./ExamIntro";

type Step = "intro" | "check" | "exam" | "saving";

async function askMicOnce() {
  // Ask for the mic before fullscreen, so no permission prompt interrupts the exam.
  const s = await navigator.mediaDevices.getUserMedia({ audio: true });
  s.getTracks().forEach((t) => t.stop());
}

export function ExamFlow() {
  const router = useRouter();
  const { state } = useGame();
  const gaze = useGazeTracker();
  const take = useSpeechTake(EXAM.limitSec);
  const [step, setStep] = useState<Step>("intro");
  const [prompt, setPrompt] = useState({ topic: "", phrase: "" });
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const flags = useRef<ExamFlags>({});
  const game = state && state !== "none" ? state : null;

  useEffect(() => setPrompt({ topic: randomTopic(), phrase: randomPhrase() }), []);

  // Anti-cheat while recording: leaving the tab or fullscreen is flagged.
  useEffect(() => {
    if (take.phase !== "recording") return;
    const onVisibility = () => {
      if (document.hidden) {
        flags.current.leftTab = true;
        setWarning("You left the exam tab. This attempt is flagged.");
      }
    };
    const onFullscreen = () => {
      if (!document.fullscreenElement) {
        flags.current.leftFullscreen = true;
        setWarning("You exited fullscreen. This attempt is flagged.");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [take.phase]);

  // Finished take → measure, rate, settle, show the result.
  useEffect(() => {
    if (take.phase !== "done" || !take.result || !game || step === "saving") return;
    setStep("saving");
    const { metrics, transcript } = take.result;
    const stats = gaze.stopCounting();
    gaze.release();
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});

    if (!checkLiveness(prompt.phrase, transcript).passed) flags.current.livenessPhraseMissing = true;
    if (faceMissingShare(stats) > 1 / 3) flags.current.faceMissing = true;
    if (stats.frames && stats.multiFaceFrames / stats.frames > 0.1) flags.current.multipleFaces = true;

    const input: ExamInput = {
      fillersPerMin: metrics.fillersPerMin,
      wpm: metrics.wpm,
      eyeContactPct: eyeContactPct(stats),
      speakingSec: metrics.speakingSec,
      practiceDays: game.calendar.practiceDays,
      flags: { ...flags.current },
    };
    const rating = rateAttempt(
      game.rating,
      EXAM_DIFFICULTY,
      performanceScore({ ...metrics, eyeContactPct: input.eyeContactPct }, EXAM_TASK),
    );
    const attemptId = crypto.randomUUID();
    const takenAt = new Date().toISOString();
    saveAttempt({
      id: attemptId,
      kind: "exam",
      topic: prompt.topic,
      phrase: prompt.phrase,
      transcript,
      metrics: { ...withoutTokens(metrics) },
      flags: input.flags as Record<string, boolean>,
      createdAt: takenAt,
    });
    addRecord({
      entryId: game.entry.id,
      date: game.today,
      attemptId,
      taskId: "exam",
      taskKind: "exam",
      difficulty: EXAM_DIFFICULTY,
      change: rating,
      flags: input.flags as Record<string, boolean>,
      createdAt: takenAt,
    });

    settleEntry(game.entry, { input, rating, topic: prompt.topic, takenAt }, guestAuthHeader)
      .then((settled) => {
        saveEntry(settled);
        router.push(`/result/${encodeURIComponent(settled.id)}`);
      })
      .catch((e: Error) => setError(e.message));
  }, [take.phase, take.result, game, step, gaze, prompt, router]);

  async function startCheck() {
    setStep("check");
    try {
      await askMicOnce();
    } catch {
      setError("Microphone access is blocked. Allow it for this site, then reload the page.");
      return;
    }
    await gaze.enable();
  }

  async function startExam() {
    flags.current = {};
    setWarning("");
    // Request fullscreen inside the click, but never wait on it: some browsers
    // (and phones) never resolve it, and the exam must still start.
    void document.documentElement.requestFullscreen?.().catch(() => {});
    gaze.startCounting();
    setStep("exam");
    await take.start();
  }

  if (state === null) return <p className="font-mono text-sm text-muted">loading…</p>;
  if (state === "none") return <EmptyGame />;
  if (error) {
    return (
      <Notice title="The exam couldn’t be completed">
        {error} Your exam was not recorded, so you can take it again.
      </Notice>
    );
  }
  if (step === "intro") return <ExamIntro practiceDays={game!.calendar.practiceDays} onNext={startCheck} />;

  const cameraBlocked = gaze.state === "denied" || gaze.state === "error";
  return (
    <div className="grid gap-5 md:grid-cols-[1fr_18rem]">
      <div className="order-2 flex flex-col gap-4 md:order-1">
        {warning && (
          <p role="alert" className="rounded-md border border-warn/40 bg-warn/10 px-4 py-2 text-sm text-warn">
            {warning}
          </p>
        )}
        {cameraBlocked ? (
          <Notice title="The exam needs your camera">
            Eye contact is part of the goal, so the exam can’t run without the camera. Allow it for this site and reload.
            Video never leaves your device.
          </Notice>
        ) : step === "check" ? (
          <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
            <h2 className="text-xl font-semibold">Camera check</h2>
            <p className="text-sm text-muted">
              Sit so your face fills the frame and look into the camera lens, not at the screen. The label turns green
              when we detect eye contact.
            </p>
            <button
              type="button"
              onClick={startExam}
              disabled={gaze.state !== "ready" || !prompt.topic}
              className="rounded-md bg-accent px-5 py-3 font-medium text-accent-ink hover:opacity-90 disabled:opacity-50"
            >
              {gaze.state === "ready" ? "Start the exam (fullscreen)" : "Loading the face model…"}
            </button>
          </div>
        ) : step === "saving" ? (
          <p className="font-mono text-sm text-muted">scoring your exam and settling the game…</p>
        ) : take.phase === "denied" ? (
          <Notice title="Microphone access is blocked">Allow the microphone for this site, then reload the page.</Notice>
        ) : take.phase === "error" ? (
          <Notice title="We couldn’t score that take" action={{ label: "Try again", onClick: startExam }}>
            {take.error} Your exam was not recorded.
          </Notice>
        ) : (
          <RecordingPanel
            topic={prompt.topic}
            phrase={prompt.phrase}
            phase={take.phase}
            elapsed={take.elapsed}
            limitSec={EXAM.limitSec}
            minSec={EXAM.minSec}
            level={take.level}
            captions={take.captions}
            onStart={startExam}
            onFinish={take.finish}
            disabled
          />
        )}
      </div>
      <div className="order-1 md:order-2">
        <CameraView videoRef={gaze.videoRef} state={gaze.state} looking={gaze.looking} />
        <Link href="/dashboard" className="mt-3 inline-block text-xs text-muted hover:underline">
          Not ready? Back to dashboard
        </Link>
      </div>
    </div>
  );
}
