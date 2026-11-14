import type { Metadata } from "next";
import Link from "next/link";
import { formatUsd, KICKSTARTER } from "@/lib/game/rules";
import { EXTRAS, SUBSCRIPTION } from "@/lib/pricing";
import { Roadmap } from "@/components/info/Roadmap";
import { TestModeBanner } from "@/components/play/TestModeBanner";
import { TestCard } from "@/components/play/TestCard";
import { SubscribeButton } from "@/components/pricing/SubscribeButton";

export const metadata: Metadata = { title: "Pricing · House Edge" };

export default function PricingPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-10">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Pricing</p>
        <h1 className="text-3xl font-semibold tracking-tight">You pay for commitment, not for content</h1>
        <p className="text-muted">The practice tools and your Speaker Rating are free. Money only moves around a game you choose to join.</p>
      </header>

      <TestModeBanner />

      <div className="grid gap-5 md:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
          <div>
            <h2 className="text-xl font-semibold">Open game</h2>
            <p className="font-mono text-sm text-muted">pay per game</p>
          </div>
          <dl className="flex flex-col gap-1 font-mono text-sm">
            <Row label="stake" value={KICKSTARTER.tiersCents.map(formatUsd).join(" / ")} />
            <Row label="card service fee" value={formatUsd(KICKSTARTER.cardFeeCents)} />
            <Row label="our fee" value={`${KICKSTARTER.commissionRate * 100}% of the bank, max`} />
          </dl>
          <p className="text-sm text-muted">
            Our fee comes only out of the stakes of players who miss their goal, never out of a winner’s stake. Reach the
            goal and you get your full stake back plus a share.
          </p>
          <Link href="/play" className="mt-auto rounded-md border border-line px-5 py-3 text-center font-medium hover:bg-raised">
            Start a game
          </Link>
        </section>

        <section className="flex flex-col gap-4 rounded-lg border border-accent/40 bg-surface p-5">
          <div>
            <h2 className="text-xl font-semibold">Subscription</h2>
            <p className="font-mono text-sm text-muted">{formatUsd(SUBSCRIPTION.priceCents)} / month</p>
          </div>
          <dl className="flex flex-col gap-1 font-mono text-sm">
            <Row label="our fee in your games" value="0%" />
            <Row label="games at a time" value={`up to ${SUBSCRIPTION.maxGames}`} />
            <Row label="card service fee" value={formatUsd(KICKSTARTER.cardFeeCents)} />
          </dl>
          <p className="text-sm text-muted">For people who keep a skill going all year. Winners split everything the others left.</p>
          <TestCard />
          <SubscribeButton />
        </section>
      </div>

      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="font-mono text-sm text-accent">extras</h2>
        <ul className="mt-3 divide-y divide-line">
          {EXTRAS.map((e) => (
            <li key={e.name} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-baseline sm:justify-between">
              <span>
                <span className="font-medium">{e.name}</span> <span className="text-sm text-muted">· {e.detail}</span>
              </span>
              <span className="font-mono text-sm">{e.price}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
        <h2 className="font-mono text-sm text-accent">more games</h2>
        <Roadmap />
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
