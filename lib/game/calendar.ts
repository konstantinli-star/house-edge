// Game calendar (pure): day counter, streak, weekly goal and how much can
// still be recovered. Dates are local "YYYY-MM-DD" strings.

import { KICKSTARTER } from "./rules";

const DAY_MS = 86_400_000;

export const toLocalDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const daysBetween = (a: string, b: string) => Math.round((parse(b) - parse(a)) / DAY_MS);
const addDays = (s: string, n: number) => new Date(parse(s) + n * DAY_MS).toISOString().slice(0, 10);

// Weeks 1–3 are 7 days (target 6 each); week 4 covers days 22–30 (target 6).
export const WEEK_TARGET = 6;
export function weekOf(day: number): number {
  return Math.min(Math.ceil(day / 7), KICKSTARTER.weeks.length);
}
function weekBounds(week: number): [number, number] {
  const start = (week - 1) * 7 + 1;
  return [start, week === KICKSTARTER.weeks.length ? KICKSTARTER.days : start + 6];
}

export type GameCalendar = {
  day: number;
  week: number;
  finished: boolean;
  practiceDays: number;
  practicedToday: boolean;
  streak: number;
  weekDone: number;
  weekTarget: number;
  weekDaysLeft: number; // days still available this week, today included if not practised yet
  weekReachable: boolean;
  missedThisWeek: number;
  daysNeeded: number; // practice days still needed for the game goal
  gameDaysLeft: number;
  goalReachable: boolean;
};

export function gameCalendar(startDate: string, practiceDates: string[], today: string): GameCalendar {
  const total = KICKSTARTER.days;
  const day = Math.min(Math.max(daysBetween(startDate, today) + 1, 1), total);
  const finished = daysBetween(startDate, today) + 1 > total;
  const dayOf = (d: string) => daysBetween(startDate, d) + 1;
  const practiced = new Set(practiceDates.filter((d) => dayOf(d) >= 1 && dayOf(d) <= total));
  const practicedToday = practiced.has(today);

  // Streak counts back from today, or from yesterday if today is not done yet.
  let streak = 0;
  for (let cursor = practicedToday ? today : addDays(today, -1); practiced.has(cursor); cursor = addDays(cursor, -1)) {
    streak++;
  }

  const week = weekOf(day);
  const [weekStart, weekEnd] = weekBounds(week);
  const weekDone = [...practiced].filter((d) => dayOf(d) >= weekStart && dayOf(d) <= weekEnd).length;
  const weekDaysLeft = weekEnd - day + (practicedToday ? 0 : 1);
  const missedThisWeek = day - weekStart - (weekDone - (practicedToday ? 1 : 0));

  const daysNeeded = Math.max(0, KICKSTARTER.minPracticeDays - practiced.size);
  const gameDaysLeft = finished ? 0 : total - day + (practicedToday ? 0 : 1);

  return {
    day,
    week,
    finished,
    practiceDays: practiced.size,
    practicedToday,
    streak,
    weekDone,
    weekTarget: WEEK_TARGET,
    weekDaysLeft,
    weekReachable: weekDone + weekDaysLeft >= WEEK_TARGET,
    missedThisWeek: Math.max(0, missedThisWeek),
    daysNeeded,
    gameDaysLeft,
    goalReachable: daysNeeded <= gameDaysLeft,
  };
}
