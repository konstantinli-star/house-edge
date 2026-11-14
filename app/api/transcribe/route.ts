// Speech-to-text that keeps filler words. The prompt primes the model to
// transcribe disfluencies ("um", "uh", "like") instead of cleaning them up.
// Audio is forwarded to OpenAI and never stored by us.

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 8 * 1024 * 1024;
const FILLER_PROMPT = "Umm, so, like, you know, I was, uh, thinking... I mean, basically, uh, we, um, shipped it.";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: "Transcription is not configured." }, { status: 503 });

  const form = await req.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return Response.json({ error: "No audio received." }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) return Response.json({ error: "Recording is too long." }, { status: 413 });

  const upstream = new FormData();
  upstream.append("file", audio, audio.name);
  upstream.append("model", process.env.OPENAI_STT_MODEL || "whisper-1");
  upstream.append("language", "en");
  upstream.append("prompt", FILLER_PROMPT);
  upstream.append("response_format", "json");

  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return Response.json({ error: "Transcription failed." }, { status: 502 });
    const { text } = (await res.json()) as { text: string };
    return Response.json({ text });
  } catch {
    return Response.json({ error: "Transcription timed out." }, { status: 504 });
  }
}
