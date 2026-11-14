import type { Metadata } from "next";
import { ExamFlow } from "@/components/exam/ExamFlow";

export const metadata: Metadata = { title: "Final exam · Upscale" };

export default function ExamPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-10">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Strict · camera + microphone</p>
        <h1 className="text-3xl font-semibold tracking-tight">Final exam</h1>
      </header>
      <ExamFlow />
    </div>
  );
}
