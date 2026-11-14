import Link from "next/link";
import { GuestButton } from "./GuestButton";
import { NAV } from "./nav";

export function Header() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-6 place-items-center rounded bg-accent font-mono text-xs text-accent-ink">
            HE
          </span>
          Upscale
        </Link>
        {/* Desktop only; on phones the same links are in the footer. */}
        <nav aria-label="Main" className="hidden items-center gap-5 text-sm text-muted lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-text">
              {n.label}
            </Link>
          ))}
        </nav>
        <GuestButton />
      </div>
    </header>
  );
}
