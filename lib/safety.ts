// Responsible-play settings: self-exclusion, a personal stake limit, the
// helpline and a short self-check. Stored in the browser (and self-exclusion
// also in Supabase, which the checkout route enforces).

// Verified on ncpgambling.org (Nov 2026): the national helpline moved from
// 1-800-GAMBLER to 1-800-MY-RESET.
export const HELPLINE = {
  name: "National Problem Gambling Helpline",
  display: "1-800-MY-RESET",
  digits: "18006973738",
  chatUrl: "https://www.ncpgambling.org/chat/",
} as const;

export const SELF_EXCLUSION_COOLING_DAYS = 7; // turning it off again needs a pause
export const LIMIT_RAISE_DELAY_HOURS = 24; // lowering a limit is instant, raising waits

export type SafetySettings = {
  selfExcludedAt: string | null;
  stakeLimitCents: number | null; // null = no personal limit (tiers still cap at $250)
  pendingLimit: { cents: number | null; effectiveAt: string } | null;
};

const KEY = "upscale:safety";
const DEFAULTS: SafetySettings = { selfExcludedAt: null, stakeLimitCents: null, pendingLimit: null };

export function loadSafety(now = new Date()): SafetySettings {
  let s: SafetySettings = DEFAULTS;
  try {
    s = { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<SafetySettings>) };
  } catch {
    return DEFAULTS;
  }
  // Apply a raised limit once its waiting time has passed.
  if (s.pendingLimit && Date.parse(s.pendingLimit.effectiveAt) <= now.getTime()) {
    s = { ...s, stakeLimitCents: s.pendingLimit.cents, pendingLimit: null };
    saveSafety(s);
  }
  return s;
}

export function saveSafety(s: SafetySettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage blocked: settings last for this page only.
  }
}

export const isSelfExcluded = (s: SafetySettings) => s.selfExcludedAt !== null;

export function canLiftExclusion(s: SafetySettings, now = new Date()): boolean {
  if (!s.selfExcludedAt) return true;
  return now.getTime() - Date.parse(s.selfExcludedAt) >= SELF_EXCLUSION_COOLING_DAYS * 86_400_000;
}

// Lowering (or setting a first limit) is immediate; raising or removing waits.
export function changeLimit(s: SafetySettings, cents: number | null, now = new Date()): SafetySettings {
  const current = s.stakeLimitCents;
  const isStricter = cents !== null && (current === null || cents < current);
  if (isStricter) return { ...s, stakeLimitCents: cents, pendingLimit: null };
  if (cents === current) return { ...s, pendingLimit: null };
  const effectiveAt = new Date(now.getTime() + LIMIT_RAISE_DELAY_HOURS * 3_600_000).toISOString();
  return { ...s, pendingLimit: { cents, effectiveAt } };
}

export const withinLimit = (s: SafetySettings, stakeCents: number) =>
  s.stakeLimitCents === null || stakeCents <= s.stakeLimitCents;

// A short, non-diagnostic self-check (adapted from brief screens such as Lie/Bet and BBGS).
export const SCREENING_QUESTIONS = [
  "Have you felt the need to put more and more money into games like this?",
  "Have you hidden from people close to you how much you spend on stakes?",
  "Have you felt restless or irritable when trying to cut down?",
  "Have you tried to win back money you lost in another game?",
] as const;
