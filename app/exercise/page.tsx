import type { Metadata } from "next";
import { ExerciseFlow } from "@/components/exercise/ExerciseFlow";

export const metadata: Metadata = { title: "Today’s task · Upscale" };

export default function ExercisePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Today’s task</h1>
      <ExerciseFlow />
    </div>
  );
}
