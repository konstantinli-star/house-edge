import Link from "next/link";
import { HELPLINE } from "@/lib/safety";
import { NAV } from "./nav";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 text-xs text-muted sm:px-6">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-text">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <span>Test mode. No real money moves.</span>
          <span>18+ only. Availability depends on your state.</span>
          <span>
            Need help? Call or text{" "}
            <a href={`tel:+${HELPLINE.digits}`} className="underline hover:text-text">
              {HELPLINE.display}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
