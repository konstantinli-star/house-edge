import type { Metadata } from "next";
import { PlayFlow } from "@/components/play/PlayFlow";

export const metadata: Metadata = { title: "Kickstarter · House Edge" };

export default function PlayPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-10">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Game · 30 days</p>
        <h1 className="text-3xl font-semibold tracking-tight">Kickstarter: one goal, one stake</h1>
        <p className="text-muted">
          Put a stake on your own progress. Your result depends only on how you perform, measured live.
        </p>
      </header>
      <PlayFlow />
    </div>
  );
}
