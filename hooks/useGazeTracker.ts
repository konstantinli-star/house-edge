"use client";

// Camera + MediaPipe FaceLandmarker in the browser. Video never leaves the
// device: we keep only frame counts, and send just the final percentage.

import { useCallback, useEffect, useRef, useState } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { emptyStats, readGaze, type GazeStats } from "@/lib/vision/gaze";

const MEDIAPIPE_VERSION = "1.1.1"; // keep in sync with package.json
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const SAMPLE_MS = 100; // ~10 frames per second is plenty for a percentage

export type CameraState = "idle" | "loading" | "ready" | "denied" | "error";

async function loadLandmarker(): Promise<FaceLandmarker> {
  const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    runningMode: "VIDEO",
    numFaces: 2, // a second face is an anti-cheat flag
  });
}

export function useGazeTracker() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<CameraState>("idle");
  const [looking, setLooking] = useState<boolean | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const landmarker = useRef<FaceLandmarker | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const stats = useRef<GazeStats>(emptyStats());
  const counting = useRef(false);

  const sample = useCallback(() => {
    const video = videoRef.current;
    if (!video || !landmarker.current || video.readyState < 2) return;
    const result = landmarker.current.detectForVideo(video, performance.now());
    const faces = result.faceLandmarks ?? [];
    const reading = faces[0] ? readGaze(faces[0]) : null;
    setLooking(reading?.looking ?? false);
    if (!counting.current) return;
    const s = stats.current;
    s.frames++;
    if (faces.length) s.faceFrames++;
    if (faces.length > 1) s.multiFaceFrames++;
    if (reading?.looking) s.lookingFrames++;
  }, []);

  const enable = useCallback(async () => {
    setState("loading");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } });
    } catch {
      setState("denied");
      return;
    }
    try {
      if (videoRef.current) {
        videoRef.current.srcObject = stream.current;
        await videoRef.current.play();
      }
      landmarker.current ??= await loadLandmarker();
      timer.current = window.setInterval(sample, SAMPLE_MS);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [sample]);

  const startCounting = useCallback(() => {
    stats.current = emptyStats();
    counting.current = true;
  }, []);

  const stopCounting = useCallback((): GazeStats => {
    counting.current = false;
    return { ...stats.current };
  }, []);

  const release = useCallback(() => {
    window.clearInterval(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);

  useEffect(() => () => {
    release();
    landmarker.current?.close();
  }, [release]);

  return { videoRef, state, looking, enable, startCounting, stopCounting, release };
}
