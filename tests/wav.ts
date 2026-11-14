// Minimal 16-bit PCM WAV reader for tests.
export function readWav(buf: Buffer): { samples: Float32Array; sampleRate: number } {
  let offset = 12;
  let sampleRate = 0;
  let channels = 1;
  while (offset < buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "fmt ") {
      channels = buf.readUInt16LE(offset + 10);
      sampleRate = buf.readUInt32LE(offset + 12);
    }
    if (id === "data") {
      const count = size / 2 / channels;
      const samples = new Float32Array(count);
      for (let i = 0; i < count; i++) samples[i] = buf.readInt16LE(offset + 8 + i * 2 * channels) / 32768;
      return { samples, sampleRate };
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error("No data chunk");
}
