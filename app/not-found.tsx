import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 py-20">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">This page doesn’t exist</h1>
      <p className="text-muted">The link may be old. Your games and results are still on the dashboard.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="rounded-md bg-accent px-5 py-3 text-center font-medium text-accent-ink hover:opacity-90">
          Go to the home page
        </Link>
        <Link href="/dashboard" className="rounded-md border border-line px-5 py-3 text-center font-medium hover:bg-raised">
          Open dashboard
        </Link>
      </div>
    </div>
  );
}
