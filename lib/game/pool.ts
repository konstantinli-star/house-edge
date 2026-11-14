// Simulated pool of 99 players for the demo game (clearly labelled in the UI).
// Deterministic per game, so everyone sees the same pool. Each player has a
// planned quit day (or none); as the game clock moves, players drop out.

import { OPEN_GAME_COMMISSION, settlePool, type PoolPlayer, type Settlement } from "./payout";
import { seededRandom } from "./tasks";

export type SimulatedPlayer = {
  id: string;
  name: string;
  stakeCents: number;
  quitDay: number | null; // null = finishes the game
  consistency: number; // 0..1, used to project who is likely to finish
};

export const POOL_SIZE = 99;
// Historical target: 60–75% of players reach the goal. Forecast uses the middle.
export const PROJECTED_FINISH_RATE = 0.7;

const FIRST = ["Anna", "Marcus", "Priya", "Jordan", "Emily", "Diego", "Sam", "Chloe", "Tyler", "Aisha", "Ben", "Grace",
  "Kevin", "Maya", "Luis", "Hannah", "Omar", "Rachel", "Nate", "Sofia", "Chris", "Lauren", "Andre", "Megan", "Ryan"];
const LAST = "ABCDEFGHJKLMNPRSTW";

export function simulatedPool(gameSlug: string): SimulatedPlayer[] {
  const rand = seededRandom(`pool:${gameSlug}`);
  return Array.from({ length: POOL_SIZE }, (_, i) => {
    const r = rand();
    const stakeCents = r < 0.35 ? 5000 : r < 0.85 ? 10000 : 25000;
    const quits = rand() < 0.3;
    return {
      id: `sim-${i}`,
      name: `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}.`,
      stakeCents,
      quitDay: quits ? 3 + Math.floor(rand() * 26) : null,
      consistency: rand(),
    };
  });
}

export type Forecast = {
  payoutCents: number;
  stakeCents: number;
  bankCents: number;
  players: number;
  active: number;
  projectedWinners: number;
  commissionCents: number;
};

// "If you finish" forecast with the real payout function. Players who already
// left count as not reaching the goal; of those still in, the most consistent
// are projected to finish at the historical rate.
// Pool outcomes as of `day`: players who left lose; of those still in, the most
// consistent are projected to finish at the historical rate.
function projectedPool(pool: SimulatedPlayer[], day: number) {
  const active = pool.filter((p) => p.quitDay === null || p.quitDay > day);
  const winnersCount = Math.min(active.length, Math.round(pool.length * PROJECTED_FINISH_RATE));
  const winners = new Set(
    [...active].sort((a, b) => b.consistency - a.consistency).slice(0, winnersCount).map((p) => p.id),
  );
  const players: PoolPlayer[] = pool.map((p) => ({ id: p.id, stakeCents: p.stakeCents, won: winners.has(p.id) }));
  return { players, active: active.length, winnersCount };
}

// "If you finish" forecast with the real payout function.
export function payoutForecast(
  pool: SimulatedPlayer[],
  day: number,
  you: { stakeCents: number },
  commissionRate = OPEN_GAME_COMMISSION,
): Forecast {
  const { players, active, winnersCount } = projectedPool(pool, day);
  const all = [...players, { id: "you", stakeCents: you.stakeCents, won: true }];
  const s = settlePool(all, commissionRate);
  return {
    payoutCents: s.payouts.you,
    stakeCents: you.stakeCents,
    bankCents: s.bankCents,
    players: all.length,
    active: active + 1,
    projectedWinners: winnersCount + 1,
    commissionCents: s.commissionCents,
  };
}

export type FinalSettlement = Settlement & { yourPayoutCents: number; winners: number; players: number };

// End of game: the simulated pool's final outcomes plus the player's real result.
export function finalSettlement(
  pool: SimulatedPlayer[],
  days: number,
  you: { stakeCents: number; won: boolean },
  commissionRate = OPEN_GAME_COMMISSION,
): FinalSettlement {
  const { players, winnersCount } = projectedPool(pool, days);
  const all = [...players, { id: "you", stakeCents: you.stakeCents, won: you.won }];
  const s = settlePool(all, commissionRate);
  return { ...s, yourPayoutCents: s.payouts.you ?? 0, winners: winnersCount + (you.won ? 1 : 0), players: all.length };
}

export type FeedItem = { day: number; text: string };

// Community feed derived from the same pool (no events about people quitting).
export function communityFeed(pool: SimulatedPlayer[], day: number, limit = 6): FeedItem[] {
  const items: FeedItem[] = [];
  for (let d = Math.max(1, day - 6); d <= day; d++) {
    const rand = seededRandom(`feed:${d}`);
    const active = pool.filter((p) => p.quitDay === null || p.quitDay > d);
    for (let k = 0; k < 2 && active.length; k++) {
      const p = active[Math.floor(rand() * active.length)];
      const r = rand();
      const text =
        d % 7 === 0 && r < 0.5
          ? `${p.name} finished week ${d / 7} on target`
          : r < 0.35
            ? `${p.name} kept a ${Math.min(d, 2 + Math.floor(rand() * 8))}-day streak`
            : r < 0.6
              ? `${p.name} unlocked a coach clip review`
              : r < 0.8
                ? `${p.name} gained ${8 + Math.floor(rand() * 25)} rating points`
                : `${p.name} cut fillers below 3/min`;
      items.push({ day: d, text });
    }
  }
  return items.reverse().slice(0, limit);
}
