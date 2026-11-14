// Client side of the server transcription route (OpenAI speech-to-text).
// Returns null when the server has no key or the request fails, so the
// caller can fall back to the browser transcript.

let configured: Promise<boolean> | undefined;

// Asks /api/health once whether a server-side speech-to-text key is set.
function serverCanTranscribe(): Promise<boolean> {
  configured ??= fetch("/api/health")
    .then((r) => r.json())
    .then((h) => Boolean(h.configured?.openai))
    .catch(() => false);
  return configured;
}

export async function transcribeOnServer(audio: Blob): Promise<string | null> {
  if (!(await serverCanTranscribe())) return null;
  const body = new FormData();
  body.append("audio", audio, `speech.${audio.type.includes("mp4") ? "mp4" : "webm"}`);
  try {
    const res = await fetch("/api/transcribe", { method: "POST", body, signal: AbortSignal.timeout(30000) });
    if (!res.ok) return null;
    const { text } = (await res.json()) as { text?: string };
    return text?.trim() || null;
  } catch {
    return null;
  }
}
