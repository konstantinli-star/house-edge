"use client";

import { useCallback, useEffect, useState } from "react";

// Steps through frames on a timer, with play/pause, speed and seeking.
export function useVirtualClock(frameCount: number, durationMs: (frame: number) => number) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const last = frameCount - 1;

  useEffect(() => {
    if (!playing) return;
    if (frame >= last) return setPlaying(false);
    const id = window.setTimeout(() => setFrame((f) => Math.min(f + 1, last)), durationMs(frame) / speed);
    return () => window.clearTimeout(id);
  }, [playing, frame, last, speed, durationMs]);

  const play = useCallback(() => {
    setFrame((f) => (f >= last ? 0 : f));
    setPlaying(true);
  }, [last]);

  return { frame, playing, speed, setSpeed, play, pause: () => setPlaying(false), seek: setFrame };
}
