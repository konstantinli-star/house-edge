import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const metadata: Metadata = { title: "Dashboard · Upscale" };

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Your game</h1>
      <Dashboard />
    </div>
  );
}
