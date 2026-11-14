// Browser-side game progress, so the stake flow survives a refresh.
// Holds the 18+ confirmation, baseline takes in progress, and the active entry.

import type { TakeSummary } from "./baseline";
import type { Entry } from "./entry";

const KEYS = {
  adult: "house-edge:adult-confirmed",
  takes: "house-edge:baseline-takes",
  entries: "house-edge:entries",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked: progress lasts for this page only.
  }
}

export const isAdultConfirmed = () => read<boolean>(KEYS.adult, false);
export const confirmAdult = () => write(KEYS.adult, true);

export const loadTakes = () => read<TakeSummary[]>(KEYS.takes, []);
export const saveTakes = (takes: TakeSummary[]) => write(KEYS.takes, takes);

export const loadEntries = () => read<Entry[]>(KEYS.entries, []);
export const activeEntry = () => loadEntries().find((e) => e.status === "active") ?? null;
export const findEntry = (id: string) => loadEntries().find((e) => e.id === id) ?? null;
export const latestEntry = () => loadEntries().at(-1) ?? null;

export function saveEntry(entry: Entry) {
  write(KEYS.entries, [...loadEntries().filter((e) => e.id !== entry.id), entry]);
}
