"use client";

import { useState } from "react";
import { HELPLINE, SCREENING_QUESTIONS } from "@/lib/safety";

// Short self-check. Answers stay in this page; nothing is stored or sent.
export function SelfCheck() {
  const [answers, setAnswers] = useState<(boolean | null)[]>(SCREENING_QUESTIONS.map(() => null));
  const done = answers.every((a) => a !== null);
  const yes = answers.filter(Boolean).length;

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
      <div>
        <h2 className="font-mono text-sm text-accent">quick self-check</h2>
        <p className="mt-1 text-sm text-muted">Four questions about the past 12 months. Not a diagnosis; your answers are not saved.</p>
      </div>
      <ol className="flex flex-col gap-3">
        {SCREENING_QUESTIONS.map((q, i) => (
          <li key={q}>
            <fieldset className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <legend className="mb-2 text-sm sm:mb-0">{q}</legend>
              <div className="flex gap-2">
                {[true, false].map((v) => (
                  <label
                    key={String(v)}
                    className="cursor-pointer rounded-md border border-line px-3 py-1 text-sm has-[:checked]:border-accent has-[:checked]:bg-raised"
                  >
                    <input
                      type="radio"
                      name={`q${i}`}
                      className="sr-only"
                      checked={answers[i] === v}
                      onChange={() => setAnswers((a) => a.map((x, j) => (j === i ? v : x)))}
                    />
                    {v ? "Yes" : "No"}
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>
      {done && (
        <p role="status" className={`rounded-md border px-4 py-3 text-sm ${yes ? "border-warn/40 text-warn" : "border-line text-muted"}`}>
          {yes
            ? `You answered yes to ${yes} of ${SCREENING_QUESTIONS.length}. Consider turning stakes off above and talking to someone: ${HELPLINE.display} is free and confidential.`
            : "No warning signs in these answers. Keep stakes small and take breaks; the limits above are there if you want them."}
        </p>
      )}
    </section>
  );
}
