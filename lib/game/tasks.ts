// Daily task generator. Tasks adapt to the player's rating (difficulty just
// above their level), follow the week's theme, and are deterministic per
// entry + day + slot, so a refresh shows the same task.

import { randomPhrase } from "@/lib/proof/liveness";
import { TOPICS } from "@/lib/topics";
import { MAX_DIFFICULTY, MIN_DIFFICULTY, type TaskLimits } from "./rating";
import { KICKSTARTER } from "./rules";

export type TaskKind = "filler-free" | "structure" | "variety" | "qa" | "control";

export type Task = TaskLimits & {
  id: string;
  kind: TaskKind;
  week: number;
  title: string;
  instruction: string;
  topic: string;
  phrase: string;
  topicLevel: 1 | 2 | 3;
  difficulty: number;
};

const QUESTIONS = [
  "Your demo looked great, but what happens when the service goes down?",
  "Why should we prioritise this over the roadmap items we already promised?",
  "What would you do differently if you had half the time?",
  "How do you know users actually want this?",
  "What's the biggest risk in your plan, and how will you handle it?",
  "Can you explain that last point in one sentence?",
];

// Seeded PRNG so a task is stable across refreshes.
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

// D from the task's parameters: stricter filler limit, longer time and harder topic raise it.
export function taskDifficulty(fillerLimitPerMin: number, timeLimitSec: number, topicLevel: number): number {
  const d =
    800 + (300 * (6 - fillerLimitPerMin)) / 4 + (150 * (timeLimitSec - 45)) / 75 + (150 * (topicLevel - 1)) / 2;
  return Math.round(Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, d)));
}

// Parameters for a target difficulty, slightly above the current rating.
function paramsFor(rating: number) {
  const target = Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, rating + 25));
  const t = (target - MIN_DIFFICULTY) / (MAX_DIFFICULTY - MIN_DIFFICULTY);
  const fillerLimitPerMin = Math.round((6 - 4 * t) * 2) / 2;
  const timeLimitSec = Math.round((45 + 75 * t) / 15) * 15;
  const topicLevel = (1 + Math.round(2 * t)) as 1 | 2 | 3;
  return { fillerLimitPerMin, timeLimitSec, topicLevel };
}

const KIND_BY_WEEK: Record<number, TaskKind> = { 1: "filler-free", 2: "structure", 3: "variety", 4: "qa" };

const COPY: Record<TaskKind, { title: string; instruction: (l: TaskLimits) => string }> = {
  "filler-free": {
    title: "Filler-free minute",
    instruction: (l) => `Stay under ${l.fillerLimitPerMin} fillers/min. When you feel an “um” coming, pause instead.`,
  },
  structure: {
    title: "Thesis → argument → conclusion",
    instruction: () => "Open with your point in one sentence, give two reasons, close with a one-line takeaway.",
  },
  variety: {
    title: "Vocal variety",
    instruction: () => "Stress one key word per sentence. Let your pitch rise and fall; no flat reading.",
  },
  qa: {
    title: "Audience question",
    instruction: (l) => `Answer like it’s the end of your demo. Point first, then one example, in under ${l.timeLimitSec} s.`,
  },
  control: {
    title: "Control measurement",
    instruction: () =>
      "Your rating jumped fast, so we run an unscheduled check. Read the phrase clearly, then speak naturally.",
  },
};

export function generateTask(opts: { entryId: string; date: string; slot: number; week: number; rating: number; control?: boolean }): Task {
  const rand = seededRandom(`${opts.entryId}:${opts.date}:${opts.slot}`);
  const week = Math.min(Math.max(opts.week, 1), KICKSTARTER.weeks.length);
  const kind: TaskKind = opts.control ? "control" : KIND_BY_WEEK[week];
  const params = paramsFor(opts.rating);
  const topic =
    kind === "qa" ? QUESTIONS[Math.floor(rand() * QUESTIONS.length)] : TOPICS[Math.floor(rand() * TOPICS.length)];

  return {
    id: `${opts.date}#${opts.slot}`,
    kind,
    week,
    title: COPY[kind].title,
    instruction: COPY[kind].instruction(params),
    topic,
    phrase: randomPhrase(4, rand),
    ...params,
    difficulty: taskDifficulty(params.fillerLimitPerMin, params.timeLimitSec, params.topicLevel),
  };
}
