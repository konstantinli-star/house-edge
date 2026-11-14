import type { TakePhase } from "@/hooks/useSpeechTake";

type Props = {
  topic: string;
  phrase?: string; // liveness phrase to read aloud before speaking
  phase: TakePhase;
  elapsed: number;
  limitSec: number;
  minSec: number;
  level: number;
  captions: { final: string; interim: string };
  disabled: boolean;
  onShuffle?: () => void; // hidden when the topic is fixed (daily tasks)
  onStart: () => void;
  onFinish: () => void;
};

export function RecordingPanel(p: Props) {
  const recording = p.phase === "recording";
  const busy = p.phase === "requesting" || p.phase === "analyzing";
  const remaining = Math.max(0, Math.ceil(p.limitSec - p.elapsed));
  const canFinish = recording && p.elapsed >= p.minSec;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-line bg-surface p-5">
        {p.phrase && (
          <div className="mb-4 border-b border-line pb-4">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">First, read this aloud</p>
            <p className="mt-2 font-mono text-lg text-accent">{p.phrase}</p>
          </div>
        )}
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Your topic</p>
        <p className="mt-2 text-xl font-medium sm:text-2xl">{p.topic || "…"}</p>
        {p.phase === "idle" && p.onShuffle && (
          <button type="button" onClick={p.onShuffle} className="mt-3 text-sm text-accent hover:underline">
            Give me another topic
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-4xl tabular-nums" aria-live="polite">
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
          </span>
          <LevelMeter level={recording ? p.level : 0} />
        </div>

        <Captions recording={recording} captions={p.captions} />

        {p.phase === "analyzing" ? (
          <p className="font-mono text-sm text-muted">analysing speech…</p>
        ) : recording ? (
          <button
            type="button"
            onClick={p.onFinish}
            disabled={!canFinish}
            className="rounded-md border border-line px-5 py-3 font-medium hover:bg-raised disabled:opacity-50"
          >
            {canFinish ? "Finish and score" : `Keep going: at least ${p.minSec} seconds`}
          </button>
        ) : (
          <button
            type="button"
            onClick={p.onStart}
            disabled={busy || p.disabled}
            className="rounded-md bg-accent px-5 py-3 font-medium text-accent-ink hover:opacity-90 disabled:opacity-60"
          >
            {p.phase === "requesting" ? "Waiting for microphone…" : `Start speaking (${p.limitSec} s)`}
          </button>
        )}
      </div>

      <p className="text-xs text-muted">
        Speak naturally, as if presenting to your team. Audio is analysed for pace, pauses and pitch on your device;
        the recording is sent once for transcription and never stored.
      </p>
    </div>
  );
}

function LevelMeter({ level }: { level: number }) {
  return (
    <div className="flex h-8 w-32 items-end gap-1" aria-hidden>
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={`flex-1 rounded-sm transition-colors ${level * 10 > i ? "bg-accent" : "bg-line"}`}
          style={{ height: `${30 + i * 7}%` }}
        />
      ))}
    </div>
  );
}

function Captions({ recording, captions }: { recording: boolean; captions: Props["captions"] }) {
  const empty = !captions.final && !captions.interim;
  return (
    <div className="min-h-24 rounded-md border border-line bg-bg p-3 font-mono text-sm leading-relaxed">
      {empty ? (
        <span className="text-muted">{recording ? "Listening…" : "Live captions appear here while you speak."}</span>
      ) : (
        <>
          {captions.final} <span className="text-muted">{captions.interim}</span>
        </>
      )}
    </div>
  );
}
