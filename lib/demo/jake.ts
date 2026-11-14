// Jake's 30 days, replayed through the SAME code a real player goes through:
// transcripts → filler detection → metrics → scores → task difficulty → Elo
// rating → calendar (streak, weekly goal) → final exam → payout.
// Only the raw inputs are seeded (what Jake "said" and the audio summary);
// every number on the demo screen is computed. Labelled "Demo data" in the UI.

import { averageBaseline, deriveGoal, type Baseline, type Goal } from "@/lib/game/baseline";
import { gameCalendar, type GameCalendar } from "@/lib/game/calendar";
import { evaluateExam, EXAM, EXAM_DIFFICULTY, EXAM_TASK, type ExamOutcome } from "@/lib/game/exam";
import type { RatingPoint } from "@/lib/game/journal";
import { finalSettlement, simulatedPool, type FinalSettlement } from "@/lib/game/pool";
import { performanceScore, rateAttempt, type RatingChange } from "@/lib/game/rating";
import { KICKSTARTER } from "@/lib/game/rules";
import { generateTask, seededRandom, type Task } from "@/lib/game/tasks";
import { computeMetrics, type SpeechMetrics } from "@/lib/proof/metrics";
import type { Prosody } from "@/lib/proof/prosody";
import { GAME_SLUG } from "@/lib/game/settle";

export const JAKE = {
  name: "Jake",
  age: 25,
  role: "Backend developer",
  story:
    "Mumbles and rushes through sprint demos, eyes on his laptop. His team lead wants a confident quarterly demo in 5 weeks before promoting him to senior.",
  stakeCents: 10000,
  start: { fillersPerMin: 8.6, wpm: 185, pitchSt: 1.6, eyePct: 31 },
  end: { fillersPerMin: 2.3, wpm: 155, pitchSt: 3.1, eyePct: 66 }, // just over the exam bar
  missedDays: [6, 13, 19, 24], // life happens; still 26 of 30
  tasksPerDay: 2,
} as const;

const ENTRY_ID = "demo-jake";
const START_DATE = "2026-10-05";

const SENTENCES = [
  "this sprint we moved the billing service to the new queue",
  "the main goal was to stop losing events during deploys",
  "we added retries with backoff and a dead letter topic",
  "error rates dropped from two percent to almost zero",
  "latency on the checkout path is now under eighty milliseconds",
  "next sprint we want to finish the migration for refunds",
  "the biggest risk is the old reporting job that reads the same table",
  "we will run both paths in parallel for one week",
  "if the numbers match we switch off the legacy consumer",
  "happy to take questions about the rollout plan",
];
const FILLERS = ["um,", "uh,", "basically", "you know,", "like,", "actually"];

const ease = (t: number) => 1 - (1 - t) ** 2; // fast early gains, then a plateau
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const dateOf = (day: number) => new Date(Date.parse(START_DATE) + (day - 1) * 86_400_000).toISOString().slice(0, 10);

// A transcript with the intended word count and number of fillers.
export function jakeTranscript(words: number, fillers: number, rand: () => number): string {
  const content: string[] = [];
  for (let i = 0; content.length < words - fillers * 1.3; i++) {
    content.push(...SENTENCES[(i + Math.floor(rand() * 3)) % SENTENCES.length].split(" "));
    content[content.length - 1] += ".";
  }
  const out = [...content];
  for (let f = 0; f < fillers; f++) {
    const at = 1 + Math.floor(rand() * (out.length - 1));
    out.splice(at, 0, FILLERS[Math.floor(rand() * FILLERS.length)]);
  }
  return out.join(" ");
}

type Speech = { transcript: string; prosody: Prosody };

function jakeSpeech(t: number, speakingSec: number, rand: () => number): Speech {
  const noise = () => (rand() - 0.5) * 2;
  const fpm = Math.max(0.5, lerp(JAKE.start.fillersPerMin, JAKE.end.fillersPerMin, ease(t)) + noise() * 0.6);
  const wpm = lerp(JAKE.start.wpm, JAKE.end.wpm, ease(t)) + noise() * 5;
  const pitchSt = lerp(JAKE.start.pitchSt, JAKE.end.pitchSt, ease(t)) + noise() * 0.2;
  const minutes = speakingSec / 60;
  const pauses = Math.round(lerp(0, 4, ease(t)) * minutes);
  return {
    transcript: jakeTranscript(Math.round(wpm * minutes), Math.round(fpm * minutes), rand),
    prosody: {
      durationSec: speakingSec + 1,
      speakingSpanSec: speakingSec,
      voicedSec: speakingSec * 0.8,
      pauses: { count: pauses, totalSec: pauses * 0.9, longestSec: pauses ? 1.1 : 0 },
      pitchVariabilitySt: Math.round(pitchSt * 100) / 100,
      hesitationSounds: 0,
    },
  };
}

export type DemoTask = { task: Task; metrics: SpeechMetrics; transcript: string; change: RatingChange };
export type DemoDay = {
  day: number;
  date: string;
  practiced: boolean;
  tasks: DemoTask[];
  rating: number;
  calendar: GameCalendar;
};
export type DemoExam = { metrics: SpeechMetrics; eyeContactPct: number; outcome: ExamOutcome; change: RatingChange; topic: string };
export type DemoRun = {
  baseline: Baseline;
  goal: Goal;
  days: DemoDay[];
  history: RatingPoint[];
  exam: DemoExam;
  settlement: FinalSettlement;
};

export function runJakeDemo(): DemoRun {
  const rand = seededRandom("jake-demo");

  // Day 0: 3-speech baseline at his starting level.
  const takes = [0, 1, 2].map(() => {
    const m = computeMetrics(...speechArgs(jakeSpeech(0, 60, rand)));
    return { fillersPerMin: m.fillersPerMin, wpm: m.wpm, pitchVariabilitySt: m.pitchVariabilitySt, pausesPerMin: m.pauses.count };
  });
  const baseline = averageBaseline(takes);
  const goal = deriveGoal(baseline.rating);

  let rating = baseline.rating;
  let practiced = 0;
  const practiceDates: string[] = [];
  const history: RatingPoint[] = [{ label: "start", rating }];
  const days: DemoDay[] = [];
  const totalPractice = KICKSTARTER.days - JAKE.missedDays.length;

  for (let day = 1; day <= KICKSTARTER.days; day++) {
    const date = dateOf(day);
    const isPractice = !(JAKE.missedDays as readonly number[]).includes(day);
    const tasks: DemoTask[] = [];
    if (isPractice) {
      practiced++;
      practiceDates.push(date);
      for (let slot = 0; slot < JAKE.tasksPerDay; slot++) {
        const week = Math.min(Math.ceil(day / 7), KICKSTARTER.weeks.length);
        const task = generateTask({ entryId: ENTRY_ID, date, slot, week, rating });
        const speech = jakeSpeech(practiced / totalPractice, task.timeLimitSec * 0.92, rand);
        const metrics = computeMetrics(...speechArgs(speech));
        const change = rateAttempt(rating, task.difficulty, performanceScore(metrics, task));
        rating = change.after;
        tasks.push({ task, metrics, transcript: speech.transcript, change });
        history.push({ label: `d${day}`, rating });
      }
    }
    days.push({ day, date, practiced: isPractice, tasks, rating, calendar: gameCalendar(START_DATE, practiceDates, date) });
  }

  // Final exam on day 30: same rules, eye contact from his last camera check.
  const examSpeech = jakeSpeech(1, EXAM.limitSec * 0.95, rand);
  const metrics = computeMetrics(...speechArgs(examSpeech));
  const outcome = evaluateExam({
    fillersPerMin: metrics.fillersPerMin,
    wpm: metrics.wpm,
    eyeContactPct: JAKE.end.eyePct,
    speakingSec: metrics.speakingSec,
    practiceDays: practiced,
    flags: {},
  });
  const change = rateAttempt(
    rating,
    EXAM_DIFFICULTY,
    performanceScore({ ...metrics, eyeContactPct: JAKE.end.eyePct }, EXAM_TASK),
  );
  history.push({ label: "exam", rating: change.after });
  const settlement = finalSettlement(simulatedPool(GAME_SLUG), KICKSTARTER.days, {
    stakeCents: JAKE.stakeCents,
    won: outcome.status === "won",
  });

  return {
    baseline,
    goal,
    days,
    history,
    exam: { metrics, eyeContactPct: JAKE.end.eyePct, outcome, change, topic: "Quarterly demo: payments migration" },
    settlement,
  };
}

// Jake's transcripts keep disfluencies, as the OpenAI route does.
function speechArgs(s: Speech): Parameters<typeof computeMetrics> {
  return [s.transcript, "openai", s.prosody];
}
