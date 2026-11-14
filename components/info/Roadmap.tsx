// Games that are planned but not built. Plain text on purpose: no buttons.
export const ROADMAP = [
  { name: "Transformer", detail: "6 months, a bigger skill change with monthly checkpoints" },
  { name: "Duel", detail: "2 weeks, $20, you against one friend on the same goal" },
  { name: "Team", detail: "teams practise together; a B2B option on the roadmap only" },
];

export function Roadmap() {
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {ROADMAP.map((r) => (
        <li key={r.name} className="flex gap-3">
          <span className="font-mono text-muted">roadmap</span>
          <span>
            <strong className="font-medium">{r.name}</strong>: {r.detail}
          </span>
        </li>
      ))}
    </ul>
  );
}
