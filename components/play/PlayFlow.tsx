"use client";

import { useEffect, useState } from "react";
import { averageBaseline, deriveGoal, type Baseline } from "@/lib/game/baseline";
import type { Entry } from "@/lib/game/entry";
import { activeEntry, confirmAdult, isAdultConfirmed, loadTakes } from "@/lib/game/progress";
import { KICKSTARTER } from "@/lib/game/rules";
import { AgeGate } from "./AgeGate";
import { BaselineTakes } from "./BaselineTakes";
import { EntrySummary } from "./EntrySummary";
import { RulesStep } from "./RulesStep";
import { StakeStep } from "./StakeStep";
import { TestModeBanner } from "./TestModeBanner";

type Step = "loading" | "entry" | "rules" | "baseline" | "age" | "stake";

// rules → 3-speech baseline → 18+ gate → goal + stake → Stripe test checkout.
export function PlayFlow() {
  const [step, setStep] = useState<Step>("loading");
  const [baseline, setBaseline] = useState<Baseline | null>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [canceled, setCanceled] = useState(false);

  // Resume where the user left off (after a refresh or a canceled checkout).
  useEffect(() => {
    setCanceled(new URLSearchParams(window.location.search).has("canceled"));
    const current = activeEntry();
    if (current) {
      setEntry(current);
      return setStep("entry");
    }
    const takes = loadTakes();
    if (takes.length >= KICKSTARTER.baselineTakes) {
      setBaseline(averageBaseline(takes));
      return setStep(isAdultConfirmed() ? "stake" : "age");
    }
    setStep(takes.length ? "baseline" : "rules");
  }, []);

  if (step === "loading") return <p className="font-mono text-sm text-muted">loading…</p>;
  if (step === "entry" && entry) return <EntrySummary entry={entry} />;

  return (
    <div className="flex flex-col gap-6">
      {canceled && step === "stake" && (
        <p role="status" className="rounded-md border border-line bg-surface px-4 py-2 text-sm text-muted">
          Checkout canceled. Nothing was charged.
        </p>
      )}
      {step === "rules" && <RulesStep onNext={() => setStep("baseline")} />}
      {step === "baseline" && (
        <BaselineTakes
          onComplete={(takes) => {
            setBaseline(averageBaseline(takes));
            setStep(isAdultConfirmed() ? "stake" : "age");
          }}
        />
      )}
      {step === "age" && (
        <AgeGate
          onConfirm={() => {
            confirmAdult();
            setStep("stake");
          }}
        />
      )}
      {step === "stake" && baseline && (
        <>
          <TestModeBanner />
          <StakeStep baseline={baseline} goal={deriveGoal(baseline.rating)} />
        </>
      )}
    </div>
  );
}
