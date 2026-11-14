// Tiny typeset-math helpers (no library): italic variables with subscripts,
// stacked fractions, and spaced operators. Server-rendered, plain HTML/CSS.

type Children = { children: React.ReactNode };

// A variable such as s_i or S_w.
export function V({ n, sub }: { n: string; sub?: string }) {
  return (
    <span className="whitespace-nowrap">
      <i>{n}</i>
      {sub && <sub className="ml-px text-[0.65em] not-italic">{sub}</sub>}
    </span>
  );
}

// A named quantity, set upright like a function name (Bank, Commission, min).
export const Name = ({ children }: Children) => <span className="not-italic">{children}</span>;

// A stacked fraction: numerator over a rule over denominator.
export function Frac({ num, den }: { num: React.ReactNode; den: React.ReactNode }) {
  return (
    <span className="mx-1 inline-flex flex-col items-center align-middle text-[0.9em] leading-tight" role="math">
      <span className="px-1.5 pb-1">{num}</span>
      <span className="w-full border-t border-current px-1.5 pt-1 text-center">{den}</span>
    </span>
  );
}

// A parenthesised group that never wraps across lines. `before` (e.g. "×")
// stays attached to the bracket so an operator never dangles at a line end.
export const Group = ({ children, before }: Children & { before?: React.ReactNode }) => (
  <span className="inline-flex items-center whitespace-nowrap">
    {before}({children})
  </span>
);

// An operator with breathing room on both sides.
export const Op = ({ children }: Children) => <span className="mx-1.5 text-muted">{children}</span>;

// One displayed formula, centred, wrapping on narrow screens.
export function Formula({ children, className = "" }: Children & { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-y-2 font-math leading-none ${className}`}>
      {children}
    </div>
  );
}
