// Mic recording with MediaRecorder plus a live input-level reading for the meter.

const MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

export const canRecord = () =>
  typeof window !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== "undefined";

export type Recording = {
  level: () => number; // 0..1, current loudness for the meter
  stop: () => Promise<Blob>;
  cancel: () => void;
};

export async function startRecording(stream: MediaStream): Promise<Recording> {
  const mimeType = MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.start(1000);

  const audioCtx = new AudioContext();
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 1024;
  audioCtx.createMediaStreamSource(stream).connect(analyser);
  const buf = new Float32Array(analyser.fftSize);

  const release = () => {
    stream.getTracks().forEach((t) => t.stop());
    void audioCtx.close();
  };

  return {
    level: () => {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += v * v;
      return Math.min(1, Math.sqrt(sum / buf.length) * 6);
    },
    stop: () =>
      new Promise((resolve) => {
        recorder.onstop = () => {
          release();
          resolve(new Blob(chunks, { type: recorder.mimeType }));
        };
        recorder.stop();
      }),
    cancel: () => {
      recorder.onstop = release;
      if (recorder.state !== "inactive") recorder.stop();
      else release();
    },
  };
}
