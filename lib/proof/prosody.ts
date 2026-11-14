// Audio-side metrics computed from raw mono samples (16 kHz recommended):
// voice activity, pauses, speaking span, pitch variety and hesitation sounds.
// Pure function: runs in the browser on the decoded recording and in unit tests.

import { estimatePitch, toSemitones } from "./pitch";

export const FRAME_SEC = 0.04;
export const HOP_SEC = 0.02;
export const PAUSE_MIN_SEC = 0.7;

export type Prosody = {
  durationSec: number;
  speakingSpanSec: number; // first voiced frame → last voiced frame
  voicedSec: number;
  pauses: { count: number; totalSec: number; longestSec: number };
  pitchVariabilitySt: number | null; // std of pitch in semitones; low = monotone
  hesitationSounds: number; // flat, sustained voiced runs ("uhhh", "ummm")
};

type Frame = { db: number; pitch: number | null };

export function analyzeSamples(samples: Float32Array, sampleRate: number): Prosody {
  const frames = toFrames(samples, sampleRate);
  const voiced = voiceActivity(frames);
  const first = voiced.indexOf(true);
  const last = voiced.lastIndexOf(true);
  const durationSec = samples.length / sampleRate;

  if (first < 0) {
    return {
      durationSec,
      speakingSpanSec: 0,
      voicedSec: 0,
      pauses: { count: 0, totalSec: 0, longestSec: 0 },
      pitchVariabilitySt: null,
      hesitationSounds: 0,
    };
  }

  return {
    durationSec,
    speakingSpanSec: (last - first) * HOP_SEC + FRAME_SEC,
    voicedSec: voiced.filter(Boolean).length * HOP_SEC,
    pauses: findPauses(voiced, first, last),
    pitchVariabilitySt: pitchVariability(frames, voiced),
    hesitationSounds: countHesitations(frames, voiced),
  };
}

function toFrames(samples: Float32Array, sampleRate: number): Frame[] {
  const size = Math.round(FRAME_SEC * sampleRate);
  const hop = Math.round(HOP_SEC * sampleRate);
  const frames: Frame[] = [];
  for (let start = 0; start + size <= samples.length; start += hop) {
    const frame = samples.subarray(start, start + size);
    let sum = 0;
    for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
    const rms = Math.sqrt(sum / frame.length);
    const db = 20 * Math.log10(rms + 1e-9);
    // Pitch only on frames loud enough to matter (saves CPU, avoids noise).
    frames.push({ db, pitch: db > -45 ? estimatePitch(frame, sampleRate) : null });
  }
  return frames;
}

// Adaptive threshold between the noise floor and typical speech level.
function voiceActivity(frames: Frame[]): boolean[] {
  if (frames.length === 0) return [];
  const sorted = frames.map((f) => f.db).sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * 0.1)];
  const loud = sorted[Math.floor(sorted.length * 0.95)];
  const threshold = Math.max(floor + 0.3 * (loud - floor), -55);
  // Too little dynamic range means there is no speech, only noise.
  if (loud - floor < 10) return frames.map(() => false);
  return frames.map((f) => f.db > threshold);
}

function findPauses(voiced: boolean[], first: number, last: number) {
  const minFrames = Math.ceil(PAUSE_MIN_SEC / HOP_SEC);
  let count = 0;
  let totalSec = 0;
  let longestSec = 0;
  let run = 0;
  for (let i = first; i <= last; i++) {
    if (!voiced[i]) {
      run++;
      continue;
    }
    if (run >= minFrames) {
      const sec = run * HOP_SEC;
      count++;
      totalSec += sec;
      longestSec = Math.max(longestSec, sec);
    }
    run = 0;
  }
  return { count, totalSec: round(totalSec), longestSec: round(longestSec) };
}

// Monotony proxy: standard deviation of pitch (semitones) over voiced frames,
// after a 5-frame median filter to remove octave errors.
function pitchVariability(frames: Frame[], voiced: boolean[]): number | null {
  const st: number[] = [];
  frames.forEach((f, i) => {
    if (voiced[i] && f.pitch) st.push(toSemitones(f.pitch));
  });
  if (st.length < 25) return null;
  const smoothed = st.map((_, i) => median(st.slice(Math.max(0, i - 2), i + 3)));
  return round(std(smoothed));
}

// Hesitation proxy for transcripts that drop "um/uh": a continuous voiced run
// of 0.35–2 s with near-flat pitch and steady loudness. Normal words change
// pitch and loudness between syllables much faster than that.
function countHesitations(frames: Frame[], voiced: boolean[]): number {
  const minFrames = Math.round(0.35 / HOP_SEC);
  const maxFrames = Math.round(2 / HOP_SEC);
  let count = 0;
  let start = -1;
  for (let i = 0; i <= frames.length; i++) {
    const pitched = i < frames.length && voiced[i] && frames[i].pitch !== null;
    if (pitched && start < 0) start = i;
    if (!pitched && start >= 0) {
      const run = frames.slice(start, i);
      if (run.length >= minFrames && run.length <= maxFrames) {
        const pitchSt = run.map((f) => toSemitones(f.pitch!));
        const dbs = run.map((f) => f.db);
        if (std(pitchSt) < 0.6 && std(dbs) < 3) count++;
      }
      start = -1;
    }
  }
  return count;
}

const round = (n: number) => Math.round(n * 100) / 100;

function std(xs: number[]): number {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
