import Link from "next/link";

// Temporary placeholder for routes built in later milestones.
export function ComingNext({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 py-20">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">In the next build</p>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted">{body}</p>
      <Link href="/" className="w-fit rounded-md border border-line px-4 py-2 text-sm hover:bg-raised">
        Back to home
      </Link>
    </div>
  );
}
