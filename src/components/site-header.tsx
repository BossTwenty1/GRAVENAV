import Link from "next/link";

const publicLinks = [
  { href: "/search", label: "Find a gravesite" },
  { href: "/map", label: "Cemetery map" },
  { href: "/admin", label: "Administrator" },
];

export function SiteHeader() {
  return (
    <header className="border-b bg-surface/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link className="text-lg font-semibold tracking-wide text-primary" href="/">
          GRAVENAV
        </Link>
        <nav aria-label="Primary navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          {publicLinks.map((link) => (
            <Link className="rounded-md px-1 py-1 hover:text-primary" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
