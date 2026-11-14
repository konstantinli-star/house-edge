import Link from "next/link";

// Shown on game screens when there is no active stake yet.
export function EmptyGame() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-6">
      <h2 className="text-xl font-semibold">No active game yet</h2>
      <p className="text-sm text-muted">
        Set your goal with a 3-speech baseline and commit a stake in test mode. Your daily tasks, streak and rating
        chart live here once you’re in.
      </p>
      <Link
        href="/play"
        className="w-fit rounded-md bg-accent px-5 py-2.5 font-medium text-accent-ink hover:opacity-90"
      >
        Start a Kickstarter game
      </Link>
    </div>
  );
}
