// Fundamental-frequency (pitch) estimate for one audio frame via
// normalised autocorrelation. Returns null for unvoiced/noisy frames.

const MIN_HZ = 75;
const MAX_HZ = 400;
const MIN_CLARITY = 0.55;

export function estimatePitch(frame: Float32Array, sampleRate: number): number | null {
  const minLag = Math.floor(sampleRate / MAX_HZ);
  const maxLag = Math.min(Math.ceil(sampleRate / MIN_HZ), frame.length - 1);

  let energy = 0;
  for (let i = 0; i < frame.length; i++) energy += frame[i] * frame[i];
  if (energy === 0) return null;

  let bestLag = -1;
  let best = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    let e1 = 0;
    let e2 = 0;
    for (let i = 0; i + lag < frame.length; i++) {
      sum += frame[i] * frame[i + lag];
      e1 += frame[i] * frame[i];
      e2 += frame[i + lag] * frame[i + lag];
    }
    const r = sum / Math.sqrt(e1 * e2 || 1);
    if (r > best) {
      best = r;
      bestLag = lag;
    }
  }

  return best >= MIN_CLARITY && bestLag > 0 ? sampleRate / bestLag : null;
}

// Hz → semitones relative to 100 Hz, so variability is comparable across voices.
export const toSemitones = (hz: number) => 12 * Math.log2(hz / 100);
