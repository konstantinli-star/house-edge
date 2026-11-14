import type { Metadata } from "next";
import { DemoPlayer } from "@/components/demo/DemoPlayer";

export const metadata: Metadata = { title: "Jake’s 30 days · House Edge" };

export default function DemoPage() {
  return (
    <div className="flex flex-col gap-6 py-10">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">About one minute</p>
        <h1 className="text-3xl font-semibold tracking-tight">Jake’s 30 days</h1>
        <p className="max-w-2xl text-muted">
          A replay on a virtual clock. Jake’s seeded speeches go through the same filler detection, scoring, Elo rating,
          weekly goals, final exam and payout code as yours.
        </p>
      </header>
      <DemoPlayer />
    </div>
  );
}
