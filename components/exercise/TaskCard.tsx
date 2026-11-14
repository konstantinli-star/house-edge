import type { Task } from "@/lib/game/tasks";

// What today's task asks for, with its limits and difficulty.
export function TaskCard({ task, rating }: { task: Task; rating: number }) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">{task.title}</h2>
        <span className="font-mono text-xs text-muted">
          W{task.week} · difficulty {task.difficulty} · your rating {rating}
        </span>
      </div>
      <p className="text-sm">{task.instruction}</p>
      <dl className="grid grid-cols-3 gap-2 font-mono text-xs">
        <Limit label="time" value={`${task.timeLimitSec} s`} />
        <Limit label="fillers" value={`≤ ${task.fillerLimitPerMin}/min`} />
        <Limit label="pace" value="130–165 wpm" />
      </dl>
    </section>
  );
}

function Limit({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-bg px-3 py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}
