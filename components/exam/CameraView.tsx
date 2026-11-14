import type { RefObject } from "react";
import type { CameraState } from "@/hooks/useGazeTracker";

// Mirrored local camera preview with a live eye-contact indicator.
export function CameraView({
  videoRef,
  state,
  looking,
  compact = false,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  state: CameraState;
  looking: boolean | null;
  compact?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-lg border border-line bg-bg ${compact ? "w-40" : "w-full"}`}>
      <video ref={videoRef} muted playsInline className="aspect-[4/3] w-full -scale-x-100 object-cover" />
      {state === "loading" && (
        <p className="absolute inset-0 grid place-items-center font-mono text-xs text-muted">loading face model…</p>
      )}
      {state === "ready" && (
        <span
          className={`absolute bottom-2 left-2 rounded px-2 py-0.5 font-mono text-xs ${looking ? "bg-accent text-accent-ink" : "bg-warn text-bg"}`}
        >
          {looking ? "eye contact" : "look at the camera"}
        </span>
      )}
    </div>
  );
}
