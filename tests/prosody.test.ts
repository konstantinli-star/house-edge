import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeSamples } from "@/lib/proof/prosody";
import { computeMetrics } from "@/lib/proof/metrics";
import { readWav } from "./wav";

const SR = 16000;

// Builds a signal from segments: tone (with optional pitch glide) or silence.
function signal(parts: { sec: number; hz?: number; toHz?: number }[]) {
  const total = parts.reduce((a, p) => a + p.sec, 0);
  const out = new Float32Array(Math.round(total * SR));
  let i = 0;
  let phase = 0;
  for (const p of parts) {
    const n = Math.round(p.sec * SR);
    for (let k = 0; k < n; k++, i++) {
      if (!p.hz) {
        out[i] = (Math.random() - 0.5) * 0.001; // quiet room noise
        continue;
      }
      const hz = p.hz + ((p.toHz ?? p.hz) - p.hz) * (k / n);
      phase += (2 * Math.PI * hz) / SR;
      out[i] = 0.3 * Math.sin(phase) + 0.15 * Math.sin(2 * phase);
    }
  }
  return out;
}

describe("analyzeSamples (synthetic)", () => {
  it("finds pauses longer than 0.7 s and ignores short gaps", () => {
    const s = signal([
      { sec: 0.5 }, { sec: 1, hz: 120, toHz: 180 }, { sec: 1.2 }, // long pause
      { sec: 1, hz: 180, toHz: 110 }, { sec: 0.3 }, // short gap
      { sec: 1, hz: 130, toHz: 200 }, { sec: 0.5 },
    ]);
    const p = analyzeSamples(s, SR);
    expect(p.pauses.count).toBe(1);
    expect(p.pauses.totalSec).toBeCloseTo(1.2, 1);
    expect(p.speakingSpanSec).toBeCloseTo(4.5, 1);
  });

  it("reports flat pitch as low variability and gliding pitch as high", () => {
    const flat = analyzeSamples(signal([{ sec: 0.3 }, { sec: 3, hz: 140 }, { sec: 0.3 }]), SR);
    const lively = analyzeSamples(signal([{ sec: 0.3 }, { sec: 1.5, hz: 110, toHz: 260 }, { sec: 1.5, hz: 260, toHz: 110 }, { sec: 0.3 }]), SR);
    expect(flat.pitchVariabilitySt!).toBeLessThan(0.5);
    expect(lively.pitchVariabilitySt!).toBeGreaterThan(3);
  });

  it("counts flat sustained 'uhhh' sounds as hesitations", () => {
    const s = signal([
      { sec: 0.3 }, { sec: 0.6, hz: 120 }, { sec: 0.4 }, // uhhh
      { sec: 0.25, hz: 150, toHz: 220 }, { sec: 0.1 }, { sec: 0.25, hz: 220, toHz: 140 }, // syllables
      { sec: 0.4 }, { sec: 0.8, hz: 115 }, { sec: 0.3 }, // ummm
    ]);
    expect(analyzeSamples(s, SR).hesitationSounds).toBe(2);
  });

  it("returns zeros for silence", () => {
    const p = analyzeSamples(signal([{ sec: 3 }]), SR);
    expect(p.speakingSpanSec).toBe(0);
    expect(p.pitchVariabilitySt).toBeNull();
  });
});

// Real speech: macOS text-to-speech at two speaking rates.
const hasSay = existsSync("/usr/bin/say");
const TEXT =
  "Good morning everyone. Today I want to show you what our team shipped this sprint. " +
  "We rebuilt the payments service, cut the error rate in half, and made deploys twice as fast. " +
  "Next sprint we will focus on the mobile checkout. Thank you, and I am happy to take questions.";

function speakText(text: string, rate = 170) {
  const file = join(mkdtempSync(join(tmpdir(), "he-say-")), "speech.wav");
  execFileSync("/usr/bin/say", ["-r", String(rate), "-o", file, "--file-format=WAVE", "--data-format=LEI16@16000", text]);
  return readWav(readFileSync(file));
}

describe.skipIf(!hasSay)("analyzeSamples (real synthesized speech)", () => {
  it("measures pace within 5% of ground truth at two speeds", () => {
    const rates = [140, 220].map((rate) => {
      const clip = speakText(TEXT, rate);
      const m = computeMetrics(TEXT, "web-speech", analyzeSamples(clip.samples, clip.sampleRate));
      // Ground truth: TTS clips have no leading/trailing silence, so words / file length.
      const truth = m.words / (clip.samples.length / clip.sampleRate / 60);
      expect(Math.abs(m.wpm - truth) / truth).toBeLessThan(0.05);
      expect(m.fillers).toBe(0);
      return m.wpm;
    });
    expect(rates[1]).toBeGreaterThan(rates[0]);
  }, 20000);

  it("detects pauses when the speaker stops between sentences", () => {
    const clip = speakText(TEXT.replaceAll(". ", ". [[slnc 1200]] "));
    expect(analyzeSamples(clip.samples, clip.sampleRate).pauses.count).toBeGreaterThanOrEqual(3);
  }, 20000);
});
