import { communityFeed, simulatedPool } from "@/lib/game/pool";

export function CommunityFeed({ day }: { day: number }) {
  const items = communityFeed(simulatedPool("kickstarter-2026-11"), day);
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-mono text-sm text-accent">community</h2>
        <span className="rounded border border-warn/40 px-1.5 py-0.5 font-mono text-xs text-warn">Simulated pool</span>
      </div>
      <ul className="flex flex-col gap-2 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3">
            <span className="w-10 shrink-0 font-mono text-xs text-muted">d{item.day}</span>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
