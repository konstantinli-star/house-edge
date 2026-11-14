// Final exam (pure): strict, absolute thresholds from the rules, plus the
// practice-days condition. All-or-nothing on the main goal.

import { taskDifficulty } from "./tasks";
import { KICKSTARTER } from "./rules";

export const EXAM = {
  limitSec: 90,
  minSec: 60,
  fillerLimitPerMin: KICKSTARTER.exam.maxFillersPerMin,
  topicLevel: 3,
} as const;

export const EXAM_DIFFICULTY = taskDifficulty(EXAM.fillerLimitPerMin, EXAM.limitSec, EXAM.topicLevel);

// The exam as a rated task (for the rating update).
export const EXAM_TASK = {
  fillerLimitPerMin: EXAM.fillerLimitPerMin,
  timeLimitSec: EXAM.limitSec,
  difficulty: EXAM_DIFFICULTY,
} as const;

export type ExamFlags = {
  livenessPhraseMissing?: boolean;
  leftTab?: boolean;
  leftFullscreen?: boolean;
  faceMissing?: boolean; // face not visible for much of the exam
  multipleFaces?: boolean;
};

export type ExamInput = {
  fillersPerMin: number;
  wpm: number;
  eyeContactPct: number | null;
  speakingSec: number;
  practiceDays: number;
  flags: ExamFlags;
};

export type Criterion = { key: string; label: string; value: string; target: string; passed: boolean };

export type ExamOutcome = {
  criteria: Criterion[];
  examPassed: boolean;
  goalReached: boolean;
  flagged: boolean;
  status: "won" | "lost" | "appeal_review";
};

export function evaluateExam(x: ExamInput): ExamOutcome {
  const t = KICKSTARTER.exam;
  const criteria: Criterion[] = [
    { key: "fillers", label: "fillers/min", value: x.fillersPerMin.toFixed(1), target: `≤ ${t.maxFillersPerMin}`, passed: x.fillersPerMin <= t.maxFillersPerMin },
    { key: "eye", label: "eye contact", value: x.eyeContactPct == null ? "not measured" : `${Math.round(x.eyeContactPct)}%`, target: `≥ ${t.minEyeContactPct}%`, passed: (x.eyeContactPct ?? 0) >= t.minEyeContactPct },
    { key: "pace", label: "pace", value: `${x.wpm} wpm`, target: `${t.paceMin}–${t.paceMax}`, passed: x.wpm >= t.paceMin && x.wpm <= t.paceMax },
    { key: "length", label: "speaking time", value: `${x.speakingSec} s`, target: `≥ ${EXAM.minSec} s`, passed: x.speakingSec >= EXAM.minSec },
    { key: "practice", label: "practice days", value: `${x.practiceDays}`, target: `≥ ${KICKSTARTER.minPracticeDays} of ${KICKSTARTER.days}`, passed: x.practiceDays >= KICKSTARTER.minPracticeDays },
  ];
  const examPassed = criteria.filter((c) => c.key !== "practice").every((c) => c.passed);
  const goalReached = criteria.every((c) => c.passed);
  const flagged = Object.values(x.flags).some(Boolean);
  // A flagged exam that would otherwise win goes to review instead of paying out.
  const status = goalReached ? (flagged ? "appeal_review" : "won") : "lost";
  return { criteria, examPassed, goalReached, flagged, status };
}

export const FLAG_LABELS: Record<keyof ExamFlags, string> = {
  livenessPhraseMissing: "Opening phrase not heard",
  leftTab: "Left the exam tab or window",
  leftFullscreen: "Exited fullscreen",
  faceMissing: "Face not visible for over a third of the exam",
  multipleFaces: "More than one face in view",
};
