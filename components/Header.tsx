import Link from "next/link";
import { GuestButton } from "./GuestButton";

export function Header() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-6 place-items-center rounded bg-accent font-mono text-xs text-accent-ink">
            HE
          </span>
          House Edge
        </Link>
        <GuestButton />
      </div>
    </header>
  );
}
