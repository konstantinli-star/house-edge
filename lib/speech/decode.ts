// Decodes a recorded audio Blob to mono 16 kHz samples for analysis.
// Runs fully on the device; audio is never uploaded for this step.

export const ANALYSIS_SAMPLE_RATE = 16000;

export async function decodeToMono16k(blob: Blob): Promise<Float32Array> {
  const data = await blob.arrayBuffer();
  const ctx = new OfflineAudioContext(1, ANALYSIS_SAMPLE_RATE, ANALYSIS_SAMPLE_RATE);
  const buffer = await ctx.decodeAudioData(data);
  return buffer.getChannelData(0);
}
