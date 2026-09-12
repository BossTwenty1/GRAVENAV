"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/deceased", label: "Deceased records" },
  { href: "/admin/interments", label: "Interments" },
  { href: "/admin/plots", label: "Plots" },
  { href: "/admin/map", label: "Map" },
  { href: "/admin/coordinates", label: "Coordinates" },
  { href: "/admin/reports", label: "Reports" },
] as const;

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Administrator navigation" className="flex gap-1 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0">
      {adminLinks.map((link) => {
        const current = link.href === "/admin" ? pathname === link.href : pathname.startsWith(`${link.href}/`) || pathname === link.href;
        return (
          <Link
            aria-current={current ? "page" : undefined}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${current ? "bg-accent text-primary" : "hover:bg-accent hover:text-primary"}`}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
