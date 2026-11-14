// Practice journal for an entry: one record per rated daily task.
// Rating history, practice days and the anti-cheat jump check all derive from it.

import type { Entry } from "./entry";
import type { RatingChange } from "./rating";

export type PracticeRecord = {
  entryId: string;
  date: string; // local YYYY-MM-DD
  attemptId: string;
  taskId: string;
  taskKind: string;
  difficulty: number;
  change: RatingChange;
  flags: Record<string, boolean>;
  createdAt: string;
};

export const MAX_RATED_TASKS_PER_DAY = 3; // no endless sessions
export const DAILY_TARGET_TASKS = 2;
export const JUMP_LIMIT = 120; // rating rise within 7 days that triggers a control measurement

const KEY = "house-edge:journal";

export function loadJournal(entryId: string): PracticeRecord[] {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "[]") as PracticeRecord[];
    return all.filter((r) => r.entryId === entryId);
  } catch {
    return [];
  }
}

export function addRecord(record: PracticeRecord) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "[]") as PracticeRecord[];
    localStorage.setItem(KEY, JSON.stringify([...all, record]));
  } catch {
    // Storage blocked: the result is shown but not kept.
  }
}

export const currentRating = (entry: Entry, journal: PracticeRecord[]) =>
  journal.length ? journal[journal.length - 1].change.after : entry.baseline.rating;

export const practiceDates = (journal: PracticeRecord[]) => [...new Set(journal.map((r) => r.date))];

export const tasksDoneOn = (journal: PracticeRecord[], date: string) => journal.filter((r) => r.date === date).length;

export type RatingPoint = { label: string; rating: number };

export function ratingHistory(entry: Entry, journal: PracticeRecord[]): RatingPoint[] {
  return [
    { label: "start", rating: entry.baseline.rating },
    ...journal.map((r, i) => ({ label: `#${i + 1}`, rating: r.change.after })),
  ];
}

// Sudden jump: rating rose more than JUMP_LIMIT over the last 7 days and no
// control measurement has been done since. The next task is then a control.
export function controlRequired(entry: Entry, journal: PracticeRecord[], today: string): boolean {
  const weekAgo = new Date(Date.parse(today) - 7 * 86_400_000).toISOString().slice(0, 10);
  const before = journal.filter((r) => r.date < weekAgo);
  const ratingWeekAgo = before.length ? before[before.length - 1].change.after : entry.baseline.rating;

  // A passed control resets the reference point.
  const lastControl = [...journal].reverse().find((r) => r.taskKind === "control");
  const reference = Math.max(ratingWeekAgo, lastControl?.change.after ?? -Infinity);
  return currentRating(entry, journal) - reference > JUMP_LIMIT;
}
