// Shown on every screen that mentions money.
export function TestModeBanner() {
  return (
    <div role="note" className="rounded-md border border-warn/40 bg-warn/10 px-4 py-2 font-mono text-xs text-warn">
      Test mode. No real money moves.
    </div>
  );
}
