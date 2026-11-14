export function UnsupportedNotice({ support }: { support: "no-mic" | "no-transcript" }) {
  return (
    <Notice title="This browser can’t run the speech test">
      Open House Edge in <strong>Chrome</strong> or <strong>Edge</strong> on a computer or phone with a microphone.
      {support === "no-transcript" && " Your browser has no built-in speech recognition."}
    </Notice>
  );
}

// Calm full-width notice for permission, support and error states.
export function Notice({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-lg border border-warn/40 bg-surface p-5">
      <h2 className="font-medium text-warn">{title}</h2>
      <p className="text-sm text-muted">{children}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="w-fit rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink hover:opacity-90"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
