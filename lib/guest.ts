// Guest session: one click, no sign-up.
// Always kept in localStorage so the flow survives a refresh.
// If Supabase is configured, we also create an anonymous Supabase user
// so later milestones can store attempts under row-level security.

import { getSupabase } from "./supabase";

export type GuestSession = {
  id: string; // local id (or Supabase user id when available)
  createdAt: string;
  backend: "supabase" | "local";
};

const STORAGE_KEY = "upscale:guest";
export const GUEST_EVENT = "upscale:guest-changed";

export function readGuest(): GuestSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GuestSession) : null;
  } catch {
    return null;
  }
}

function saveGuest(session: GuestSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Private mode or blocked storage: session lives for this page only.
  }
  window.dispatchEvent(new Event(GUEST_EVENT)); // keeps the header in sync
}

export async function startGuest(): Promise<GuestSession> {
  const existing = readGuest();
  if (existing) return existing;

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (!error && data.user) {
      // Player row is needed before attempts can be saved (RLS: own row only).
      await supabase.from("players").upsert({ id: data.user.id }, { onConflict: "id", ignoreDuplicates: true });
      const session: GuestSession = {
        id: data.user.id,
        createdAt: new Date().toISOString(),
        backend: "supabase",
      };
      saveGuest(session);
      return session;
    }
    // Fall through to a local session; the user is never blocked.
  }

  const session: GuestSession = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    backend: "local",
  };
  saveGuest(session);
  return session;
}

// Bearer token for server routes; null in local-only guest mode.
export async function guestAuthHeader(): Promise<Record<string, string>> {
  const supabase = getSupabase();
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

export function shortId(id: string) {
  return id.slice(0, 6);
}
