// Payout math (pure). Money of players who missed the goal is split among
// winners in proportion to their stakes. The commission comes ONLY out of
// the losers' money, so a winner's own stake is never touched.
//
//   L = losers' stakes, S_w = winners' stakes, Bank = L + S_w
//   Commission = min(f * Bank, L)
//   Payout_i   = s_i + (s_i / S_w) * (L - Commission)
//
// Nobody wins → the whole bank rolls over to the next game of the same type.

export type PoolPlayer = { id: string; stakeCents: number; won: boolean };

export type Settlement = {
  bankCents: number;
  losersCents: number;
  winnersCents: number;
  commissionCents: number;
  rolloverCents: number;
  payouts: Record<string, number>; // winners only, in cents
};

export const OPEN_GAME_COMMISSION = 0.15;
export const SUBSCRIBER_COMMISSION = 0;

// One winner's payout: their stake plus their proportional share of what is left.
export function winnerPayout(stakeCents: number, winnersCents: number, netLosersCents: number): number {
  if (winnersCents <= 0) return 0;
  return stakeCents + Math.round((stakeCents / winnersCents) * netLosersCents);
}

export function settlePool(players: PoolPlayer[], commissionRate: number): Settlement {
  const sum = (ps: PoolPlayer[]) => ps.reduce((a, p) => a + p.stakeCents, 0);
  const winners = players.filter((p) => p.won);
  const losersCents = sum(players.filter((p) => !p.won));
  const winnersCents = sum(winners);
  const bankCents = losersCents + winnersCents;

  if (winnersCents === 0) {
    return { bankCents, losersCents, winnersCents, commissionCents: 0, rolloverCents: bankCents, payouts: {} };
  }

  const commissionCents = Math.min(Math.round(commissionRate * bankCents), losersCents);
  const net = losersCents - commissionCents;
  const payouts = Object.fromEntries(winners.map((w) => [w.id, winnerPayout(w.stakeCents, winnersCents, net)]));
  return { bankCents, losersCents, winnersCents, commissionCents, rolloverCents: 0, payouts };
}
