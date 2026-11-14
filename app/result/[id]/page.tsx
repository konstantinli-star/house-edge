import type { Metadata } from "next";
import { ResultView } from "@/components/result/ResultView";

export const metadata: Metadata = { title: "Result · Upscale" };

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Your result</h1>
      <ResultView id={decodeURIComponent(id)} />
    </div>
  );
}
