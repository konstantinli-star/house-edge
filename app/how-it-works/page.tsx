import type { Metadata } from "next";
import Link from "next/link";
import { KICKSTARTER } from "@/lib/game/rules";
import { PayoutFormulas } from "@/components/info/PayoutFormulas";
import { PayoutTable } from "@/components/info/PayoutTable";
import { Roadmap } from "@/components/info/Roadmap";

export const metadata: Metadata = { title: "How it works · House Edge" };

const STEPS = [
  ["Measure", "Speak for a minute. The Proof Engine measures fillers, pace, pauses and vocal variety from your own voice."],
  ["Commit", "Three timed speeches set your baseline and your goal. Put $50 or $100 on it (test mode)."],
  ["Practise", "10–15 minutes a day. Tasks adapt to your Speaker Rating, which moves like a chess rating."],
  ["Prove it", `A live final exam under camera and microphone, plus ${KICKSTARTER.minPracticeDays} of ${KICKSTARTER.days} practice days.`],
  ["Settle", "Reach the goal: your stake back plus a share of what others left. Miss it: your stake goes to those who finished."],
];

const PROOF = [
  "A random topic and a random phrase to read aloud every time, so a recording made earlier can't be replayed.",
  "Eye contact is measured on your device; only the percentage is kept. We never store audio or video.",
  "The exam runs in fullscreen; leaving the tab or another face in view is flagged.",
  "A rating jump of more than 120 in a week triggers an unscheduled control check.",
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-10">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">How it works</p>
        <h1 className="text-3xl font-semibold tracking-tight">A stake on yourself, judged by evidence</h1>
        <p className="text-muted">
          Courses are easy to quit because nothing happens when you do. House Edge adds a stake, measures your progress
          objectively, and pays the people who keep going.
        </p>
      </header>

      <ol className="flex flex-col gap-3">
        {STEPS.map(([title, body], i) => (
          <li key={title} className="flex gap-4 rounded-lg border border-line bg-surface p-4">
            <span className="font-mono text-sm text-accent">0{i + 1}</span>
            <div>
              <h2 className="font-medium">{title}</h2>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">The payout formula</h2>
        <PayoutFormulas />
        <p className="text-sm text-muted">
          The fee comes only out of the stakes of players who missed the goal. If everyone wins, everyone gets their stake
          back and we take nothing. If nobody wins, the bank rolls over to the next game.
        </p>
        <PayoutTable />
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-surface p-5">
        <h2 className="font-mono text-sm text-accent">conflict of interest</h2>
        <p className="text-sm">
          We don’t make more money when you fail. Our fee is capped at 15% of the bank, so it doesn’t grow as more
          players miss their goal, and it falls to $0 once more than 85% of players reach it. Money from players who miss
          goes to the players who finish. We design games so that 60–75% of players reach the goal (highlighted rows).
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">How we keep it honest</h2>
        <List items={PROOF} tone="text-accent" />
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
        <h2 className="font-mono text-sm text-accent">games</h2>
        <p className="text-sm">
          <strong className="font-medium">Kickstarter</strong>: 30 days, one goal, $50–$250. The only game in this build.
        </p>
        <Roadmap />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/baseline" className="rounded-md bg-accent px-5 py-3 text-center font-medium text-accent-ink hover:opacity-90">
          Get your Speaker Rating in 60 seconds
        </Link>
        <Link href="/responsible" className="rounded-md border border-line px-5 py-3 text-center font-medium hover:bg-raised">
          Responsible play
        </Link>
      </div>
    </div>
  );
}

function List({ title, items, tone }: { title?: string; items: string[]; tone: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      {title && <h2 className={`font-mono text-sm ${tone}`}>{title}</h2>}
      <ul className={`flex flex-col gap-2 text-sm ${title ? "mt-3" : ""}`}>
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="text-muted" aria-hidden>
              ›
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
