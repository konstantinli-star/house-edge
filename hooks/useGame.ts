"use client";

// Current game state for the active entry, derived from local storage:
// day, streak, weekly goal, rating, and today's next task.

import { useCallback, useEffect, useState } from "react";
import { gameCalendar, toLocalDate, type GameCalendar } from "@/lib/game/calendar";
import type { Entry } from "@/lib/game/entry";
import {
  controlRequired,
  currentRating,
  loadJournal,
  MAX_RATED_TASKS_PER_DAY,
  practiceDates,
  tasksDoneOn,
  type PracticeRecord,
} from "@/lib/game/journal";
import { activeEntry } from "@/lib/game/progress";
import { generateTask, type Task } from "@/lib/game/tasks";

export type GameState = {
  entry: Entry;
  journal: PracticeRecord[];
  today: string;
  calendar: GameCalendar;
  rating: number;
  tasksToday: number;
  control: boolean;
  nextTask: Task | null; // null once today's rated tasks are done or the game is over
};

export function computeGame(entry: Entry, now = new Date()): GameState {
  const journal = loadJournal(entry.id);
  const today = toLocalDate(now);
  const calendar = gameCalendar(toLocalDate(new Date(entry.createdAt)), practiceDates(journal), today);
  const rating = currentRating(entry, journal);
  const tasksToday = tasksDoneOn(journal, today);
  const control = controlRequired(entry, journal, today);
  const nextTask =
    calendar.finished || tasksToday >= MAX_RATED_TASKS_PER_DAY
      ? null
      : generateTask({ entryId: entry.id, date: today, slot: tasksToday, week: calendar.week, rating, control });
  return { entry, journal, today, calendar, rating, tasksToday, control, nextTask };
}

export function useGame() {
  const [state, setState] = useState<GameState | null | "none">(null);

  const refresh = useCallback(() => {
    const entry = activeEntry();
    setState(entry ? computeGame(entry) : "none");
  }, []);

  useEffect(refresh, [refresh]);
  return { state, refresh };
}
