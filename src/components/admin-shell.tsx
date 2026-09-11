import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAdministrator } from "@/app/admin/actions";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/deceased", label: "Deceased records" },
  { href: "/admin/interments", label: "Interments" },
  { href: "/admin/plots", label: "Plots" },
  { href: "/admin/map", label: "Map" },
  { href: "/admin/coordinates", label: "Coordinates" },
  { href: "/admin/reports", label: "Reports" },
];

export function AdminShell({ children, displayName }: { children: ReactNode; displayName: string | null }) {
  return (
    <div className="min-h-screen bg-[#eef3ee]">
      <header className="border-b bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div>
            <Link className="text-lg font-semibold tracking-wide text-primary" href="/admin">
              GRAVENAV Admin
            </Link>
            <p className="mt-1 text-xs text-muted">
              Signed in{displayName ? ` as ${displayName}` : " as an approved administrator"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link className="rounded-md px-3 py-2 text-sm font-semibold text-primary hover:bg-accent" href="/">
              Public site
            </Link>
            <form action={signOutAdministrator}>
              <button className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-accent" type="submit">
                Sign out
              </button>
            </form>
          </div>
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
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
