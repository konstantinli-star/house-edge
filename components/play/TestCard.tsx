// Stripe's public test card, shown before checkout so anyone can complete it.
export function TestCard() {
  return (
    <div className="rounded-lg border border-line bg-bg p-4 font-mono text-sm">
      <p className="text-xs uppercase tracking-widest text-muted">Stripe test card</p>
      <p className="mt-2 text-lg tracking-wider">4242 4242 4242 4242</p>
      <p className="mt-1 text-muted">Any future expiry · any CVC · any ZIP</p>
    </div>
  );
}
