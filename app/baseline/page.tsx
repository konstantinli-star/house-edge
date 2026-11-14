import type { Metadata } from "next";
import { BaselineFlow } from "@/components/baseline/BaselineFlow";

export const metadata: Metadata = { title: "60-second Speaker Rating · House Edge" };

export default function BaselinePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-10">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Free · no sign-up</p>
        <h1 className="text-3xl font-semibold tracking-tight">Your Speaker Rating in 60 seconds</h1>
        <p className="text-muted">
          Talk about the topic below for up to a minute. We measure filler words, pace, pauses and vocal variety from
          your actual voice.
        </p>
      </header>
      <BaselineFlow />
    </div>
  );
}
