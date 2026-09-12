"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconName = "dashboard" | "deceased" | "interments" | "plots" | "map" | "coordinates" | "reports";

const adminLinks: ReadonlyArray<{ href: string; label: string; icon: IconName; available: boolean }> = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", available: true },
  { href: "/admin/deceased", label: "Deceased records", icon: "deceased", available: true },
  { href: "/admin/interments", label: "Interments", icon: "interments", available: true },
  { href: "/admin/plots", label: "Plots", icon: "plots", available: true },
  { href: "/admin/map", label: "Cemetery map", icon: "map", available: false },
  { href: "/admin/coordinates", label: "Coordinates", icon: "coordinates", available: false },
  { href: "/admin/reports", label: "Reports", icon: "reports", available: false },
] as const;

function NavigationIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    dashboard: <><rect height="6" rx="1" width="6" x="3" y="3" /><rect height="6" rx="1" width="6" x="13" y="3" /><rect height="6" rx="1" width="6" x="3" y="13" /><rect height="6" rx="1" width="6" x="13" y="13" /></>,
    deceased: <><circle cx="11" cy="8" r="3" /><path d="M5.5 19c.6-4 2.4-6 5.5-6s4.9 2 5.5 6" /><path d="M18 6v5M15.5 8.5h5" /></>,
    interments: <><path d="M4 6h14M4 11h14M4 16h9" /><circle cx="17" cy="16" r="2" /></>,
    plots: <><path d="m4 6 5-3 5 3 4-2v12l-4 2-5-3-5 3V6Z" /><path d="M9 3v12M14 6v12" /></>,
    map: <><path d="m4 6 5-3 5 3 4-2v12l-4 2-5-3-5 3V6Z" /><path d="M9 3v12M14 6v12" /></>,
    coordinates: <><circle cx="11" cy="10" r="7" /><circle cx="11" cy="10" r="2" /><path d="M11 1v2M11 17v2M2 10h2M18 10h2" /></>,
    reports: <><path d="M5 19V9M11 19V4M17 19v-7" /><path d="M3 19h16" /></>,
  };
  return <svg aria-hidden="true" className="shrink-0" fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 22 22" width="20">{paths[name]}</svg>;
}

export function AdminNavigation({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label={compact ? "Administrator mobile navigation" : "Administrator navigation"} className={compact ? "flex gap-1 overflow-x-auto pb-1" : "grid gap-1"}>
      {adminLinks.map((link) => {
        const current = link.href === "/admin" ? pathname === link.href : pathname.startsWith(`${link.href}/`) || pathname === link.href;
        return (
          <Link
            aria-current={current ? "page" : undefined}
            className={`group flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold ${compact
              ? current ? "bg-accent text-primary" : "text-muted hover:bg-accent hover:text-primary"
              : current ? "bg-white text-primary" : "text-white/68 hover:bg-white/10 hover:text-white"}`}
            href={link.href}
            key={link.href}
          >
            <NavigationIcon name={link.icon} />
            <span>{link.label}</span>
            {!link.available && !compact ? <span className="ml-auto rounded-full border border-white/15 px-2 py-0.5 text-[0.65rem] font-semibold text-white/45">Later</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
