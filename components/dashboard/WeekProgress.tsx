import type { GameCalendar } from "@/lib/game/calendar";
import { KICKSTARTER } from "@/lib/game/rules";

// Streak, weekly goal and what can still be recovered. Encouraging, never shaming.
export function WeekProgress({ c }: { c: GameCalendar }) {
  const theme = KICKSTARTER.weeks[c.week - 1].theme;
  const stillNeeded = Math.max(0, c.weekTarget - c.weekDone);

  const recovery = c.weekDone >= c.weekTarget
    ? "Weekly goal reached."
    : c.weekReachable
      ? c.missedThisWeek > 0
        ? `You can still hit this week’s goal: practise ${stillNeeded} of the ${c.weekDaysLeft} days left.`
        : `${stillNeeded} more practice day${stillNeeded === 1 ? "" : "s"} this week.`
      : `This week can reach ${c.weekDone + c.weekDaysLeft} of ${c.weekTarget}. The game goal only counts total days, so every day still helps.`;

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-mono text-sm text-accent">week {c.week}</h2>
        <span className="text-xs text-muted">{theme}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 font-mono">
        <Stat label="streak" value={`${c.streak}d`} />
        <Stat label="this week" value={`${c.weekDone}/${c.weekTarget}`} />
        <Stat label="total" value={`${c.practiceDays}/${KICKSTARTER.minPracticeDays}`} />
      </div>

      <div className="flex gap-1.5" aria-label={`${c.weekDone} of ${c.weekTarget} practice days this week`}>
        {Array.from({ length: c.weekTarget }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < c.weekDone ? "bg-accent" : "bg-line"}`} />
        ))}
      </div>

      <p className="text-sm text-muted">{recovery}</p>
      {!c.goalReachable && (
        <p className="text-sm text-warn">
          {c.daysNeeded} practice days are needed and {c.gameDaysLeft} remain. If something serious got in the way, you
          can file one appeal at the end of the game.
        </p>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-bg px-3 py-2">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-xl tabular-nums">{value}</p>
    </div>
  );
}
