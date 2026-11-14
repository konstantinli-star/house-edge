// Saved attempts (transcript + metrics only; audio is never stored).
// Always kept in localStorage; also synced to Supabase when a guest session exists.

import type { SpeechMetrics } from "./proof/metrics";
import { getSupabase } from "./supabase";

export type Attempt = {
  id: string;
  kind: "quick-baseline" | "baseline" | "daily" | "exam";
  topic: string;
  phrase?: string;
  transcript: string;
  metrics: Omit<SpeechMetrics, "tokens">;
  flags?: Record<string, boolean>;
  createdAt: string;
};

const KEY = "upscale:attempts";

// Tokens are only needed for on-screen highlighting; the transcript is kept instead.
export function withoutTokens(metrics: SpeechMetrics): Attempt["metrics"] {
  const { tokens: _tokens, ...rest } = metrics;
  return rest;
}

export function loadAttempts(): Attempt[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Attempt[];
  } catch {
    return [];
  }
}

export function saveAttempt(attempt: Attempt) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...loadAttempts(), attempt].slice(-100)));
  } catch {
    // Storage unavailable: the result is still shown, just not kept.
  }
  void syncAttempt(attempt);
}

async function syncAttempt(a: Attempt) {
  const supabase = getSupabase();
  const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
  if (!supabase || !data.session) return;
  await supabase.from("attempts").insert({
    id: a.id,
    player_id: data.session.user.id,
    kind: a.kind,
    topic: a.topic,
    phrase: a.phrase ?? null,
    transcript: a.transcript,
    metrics: a.metrics,
    flags: a.flags ?? {},
    rating_after: a.metrics.rating,
  });
}
