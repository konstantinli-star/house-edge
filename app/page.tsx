import Link from "next/link";
import { MetricLog } from "@/components/MetricLog";
import { JAKE, runJakeDemo } from "@/lib/demo/jake";

// Jake's day-0 numbers, computed by the same demo run as /demo (labelled demo data).
const jake = runJakeDemo();
const jakeDayOne = [
  { label: "fillers/min", value: jake.baseline.fillersPerMin.toFixed(1), note: "um, like, you know: target ≤ 3" },
  { label: "pace", value: `${jake.baseline.wpm} wpm`, note: "too fast: target 130–165" },
  { label: "eye contact", value: `${JAKE.start.eyePct}%`, note: "mostly the laptop: target ≥ 60%" },
  { label: "speaker rating", value: String(jake.baseline.rating), note: `goal for the game: +150 → ${jake.goal.ratingTarget}` },
];

const steps = [
  { n: "01", title: "Measure", body: "Speak for 60 seconds. The Proof Engine logs fillers, pace, pauses and eye contact live." },
  { n: "02", title: "Commit", body: "Put $50, $100 or $250 on your own 30-day goal. Test mode for now." },
  { n: "03", title: "Practice", body: "10–15 minutes a day of timed tasks. Your Speaker Rating moves like a chess rating." },
  { n: "04", title: "Prove it", body: "Pass a live final exam. Get your stake back plus a share of what quitters left." },
];

// The whole judged flow, in order. Each step links to its page.
const juryPath = [
  { href: null, label: "Click “Try as guest” in the header: one click, no sign-up." },
  { href: "/baseline", label: "Get your Speaker Rating in 60 seconds (Chrome or Edge, allow the mic)." },
  { href: "/demo", label: "Watch Jake’s 30 days: the full game replayed in about a minute (Demo data)." },
  { href: "/play", label: "Start a game: 3 short speeches, 18+, then pay in test mode with card 4242 4242 4242 4242." },
  { href: "/exercise", label: "Do today’s timed task and see your rating move (Elo)." },
  { href: "/exam", label: "Take the final exam under camera and mic (allowed any day in this build)." },
  { href: "/how-it-works", label: "Check the payout formula, the 100-player table and our conflict-of-interest statement." },
  { href: "/responsible", label: "See limits, self-exclusion and the helpline." },
];

export default function Landing() {
  return (
    <div className="flex flex-col gap-16 py-12 sm:py-20">
      <section className="grid items-start gap-10 md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Public speaking · 30-day game
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            You quit 3 courses. What if your $100 was on the line?
          </h1>
          <p className="text-lg text-muted">
            Upscale lets you put a stake on yourself. An AI Proof Engine measures how you speak, live in your
            browser. Hit your goal and you get your stake back, plus a share of what others left behind.
          </p>
          <blockquote className="border-l-2 border-accent pl-4 text-sm italic text-muted">
            In a casino the house always wins. Here the house is you.
          </blockquote>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/baseline"
              className="rounded-md bg-accent px-5 py-3 text-center font-medium text-accent-ink transition-opacity hover:opacity-90"
            >
              Get your Speaker Rating in 60 seconds
            </Link>
            <Link
              href="/demo"
              className="rounded-md border border-line px-5 py-3 text-center font-medium transition-colors hover:bg-raised"
            >
              Watch Jake’s 30 days
            </Link>
          </div>
          <p className="text-xs text-muted">Free. No sign-up. Video never leaves your device.</p>
        </div>

        <div className="flex flex-col gap-3">
          <MetricLog title="jake@sprint-review ~ day 01" badge="Demo data" rows={jakeDayOne} />
          <p className="text-xs text-muted">
            Jake, 25, backend developer. Needs to present at the quarterly demo in 5 weeks to make senior.
          </p>
        </div>
      </section>

      <section aria-labelledby="how" className="flex flex-col gap-6">
        <h2 id="how" className="text-xl font-semibold">How the game works</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n} className="rounded-lg border border-line bg-surface p-4">
              <span className="font-mono text-xs text-accent">{s.n}</span>
              <h3 className="mt-1 font-medium">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="jury" className="rounded-lg border border-accent/30 bg-surface p-5">
        <h2 id="jury" className="font-mono text-sm text-accent">For the jury: suggested path (about 10 minutes)</h2>
        <ol className="mt-3 flex flex-col gap-2 text-sm">
          {juryPath.map((step, i) => (
            <li key={step.label} className="flex gap-3">
              <span className="font-mono text-muted">{i + 1}.</span>
              {step.href ? (
                <Link href={step.href} className="hover:text-accent hover:underline">
                  {step.label}
                </Link>
              ) : (
                <span>{step.label}</span>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
