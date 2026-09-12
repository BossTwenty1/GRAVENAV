import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAdministrator } from "@/app/admin/actions";
import { AdminNavigation } from "@/components/admin-navigation";
import { GravenavMark } from "@/components/gravenav-mark";

export function AdminShell({ children, displayName }: { children: ReactNode; displayName: string | null }) {
  return (
    <div className="admin-canvas lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <a className="skip-link" href="#admin-main">Skip to main content</a>

      <aside className="relative hidden min-h-screen flex-col overflow-hidden bg-primary text-white lg:flex">
        <div aria-hidden="true" className="absolute -right-20 top-24 h-64 w-64 rounded-full border border-white/8" />
        <div aria-hidden="true" className="absolute -right-8 top-40 h-40 w-40 rounded-full border border-white/8" />
        <Link className="relative border-b border-white/10 px-6 py-6 text-white" href="/admin">
          <GravenavMark inverse />
        </Link>
        <div className="relative flex-1 px-4 py-6">
          <AdminNavigation />
        </div>
        <div className="relative border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/7 p-4">
            <p className="text-xs font-semibold text-white/55">Approved administrator</p>
            <p className="mt-1 truncate text-sm font-semibold text-white">
              {displayName ?? "Administrator account"}
            </p>
            <div className="mt-4 grid gap-1">
              <Link className="rounded-lg px-3 py-2 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white" href="/">
                Open public site
              </Link>
              <form action={signOutAdministrator}>
                <button className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white" type="submit">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="border-b bg-surface px-5 py-4 lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <Link className="min-w-0 text-primary" href="/admin"><GravenavMark compact /></Link>
            <div className="flex shrink-0 items-center gap-1">
              <Link className="admin-button-quiet px-2 sm:px-3" href="/">Public<span className="hidden min-[430px]:inline"> site</span></Link>
              <form action={signOutAdministrator}>
                <button className="admin-button-secondary px-3" type="submit">Sign out</button>
              </form>
            </div>
          </div>
        </header>
        <div className="border-b bg-surface px-3 py-2 lg:hidden">
          <AdminNavigation compact />
        </div>
        <main className="admin-content" id="admin-main" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
