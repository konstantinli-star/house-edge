import type { Metadata } from "next";
import { formatUsd, KICKSTARTER } from "@/lib/game/rules";
import { MAX_RATED_TASKS_PER_DAY } from "@/lib/game/journal";
import { HELPLINE } from "@/lib/safety";
import { SafetyControls } from "@/components/responsible/SafetyControls";
import { SelfCheck } from "@/components/responsible/SelfCheck";

export const metadata: Metadata = { title: "Responsible play · House Edge" };

const BUILT_IN = [
  `18+ only, confirmed before any stake screen. Availability depends on your state.`,
  `Stakes are ${KICKSTARTER.tiersCents.map(formatUsd).join(" / ")} only; your first game is capped at ${formatUsd(KICKSTARTER.firstStakeMaxCents)}.`,
  `One active game at a time. No raising or doubling a stake mid-game, no credit.`,
  `At most ${MAX_RATED_TASKS_PER_DAY} rated tasks a day: short sessions, no endless play.`,
  `The outcome depends only on your measured performance, never on chance.`,
  `No “almost won” animations, no paid extras that change your odds, no streak-loss shaming.`,
  `A ${formatUsd(50000)} tier is only on the roadmap, and would need an identity check and a cooling-off pause.`,
  `This build runs in Stripe test mode. No real money moves.`,
];

export default function ResponsiblePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-10">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Responsible play</p>
        <h1 className="text-3xl font-semibold tracking-tight">Stakes should motivate, not hurt</h1>
        <p className="text-muted">
          House Edge puts money on the line to help you keep a promise to yourself. If it starts to feel like pressure
          instead of motivation, use the tools below.
        </p>
      </header>

      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="font-mono text-sm text-accent">limits built into every game</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {BUILT_IN.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="text-muted" aria-hidden>
                ›
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <SafetyControls />
      <SelfCheck />

      <section className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-surface p-5">
        <h2 className="font-mono text-sm text-accent">talk to someone</h2>
        <p className="text-sm">
          {HELPLINE.name}: call or text{" "}
          <a href={`tel:+${HELPLINE.digits}`} className="font-mono text-accent underline">
            {HELPLINE.display}
          </a>{" "}
          (1-800-697-3738), or{" "}
          <a href={HELPLINE.chatUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">
            chat online
          </a>
          . Free and confidential.
        </p>
        <p className="text-xs text-muted">House Edge gives no medical or financial advice.</p>
      </section>
    </div>
  );
}
