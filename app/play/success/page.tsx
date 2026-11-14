import type { Metadata } from "next";
import { ConfirmEntry } from "@/components/play/ConfirmEntry";

export const metadata: Metadata = { title: "You’re in · House Edge" };

export default function PlaySuccessPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Kickstarter: you’re in</h1>
      <ConfirmEntry />
    </div>
  );
}
