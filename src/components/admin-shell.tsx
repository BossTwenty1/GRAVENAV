import Link from "next/link";
import type { ReactNode } from "react";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/interments", label: "Interments" },
  { href: "/admin/plots", label: "Plots" },
  { href: "/admin/map", label: "Map" },
  { href: "/admin/coordinates", label: "Coordinates" },
  { href: "/admin/reports", label: "Reports" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#eef3ee]">
      <header className="border-b bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div>
            <Link className="text-lg font-semibold tracking-wide text-primary" href="/admin">
              GRAVENAV Admin
            </Link>
            <p className="mt-1 text-xs text-muted">Foundation shell — authentication pending</p>
          </div>
          <Link className="rounded-md px-3 py-2 text-sm font-semibold text-primary hover:bg-accent" href="/">
            Public site
          </Link>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:flex-row">
        <aside className="w-full shrink-0 rounded-2xl border bg-surface p-4 lg:w-60">
          <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Administration</p>
          <nav aria-label="Administrator navigation" className="grid gap-1">
            {adminLinks.map((link) => (
              <Link className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-primary" href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
            <Link className="mt-3 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent" href="/admin/login">
              Administrator login
            </Link>
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
