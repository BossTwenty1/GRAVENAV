import Link from "next/link";

import { AdminIcon, AdminPageHeader, type AdminIconName } from "@/components/admin-ui";

const recordModules: ReadonlyArray<{ title: string; description: string; href: string; icon: AdminIconName }> = [
  { title: "Deceased records", description: "Search, review, add, and carefully correct deceased-person information.", href: "/admin/deceased", icon: "person" },
  { title: "Interments", description: "Manage verified burial placements and lifecycle history.", href: "/admin/interments", icon: "interment" },
  { title: "Plots", description: "Maintain cemetery hierarchy and derived occupancy context.", href: "/admin/plots", icon: "plot" },
];

const reservedModules = [
  ["Cemetery map", "Spatial-data preparation and map layers", "/admin/map"],
  ["Coordinates", "Capture and verification workflow", "/admin/coordinates"],
  ["Reports", "Study-required summaries and reports", "/admin/reports"],
] as const;

export const metadata = { title: "Administration" };

export default function AdminDashboardPage() {
  return (
    <div className="grid gap-5">
      <AdminPageHeader description="Work with the cemetery records currently approved for administration. Mapping, coordinates, and reports remain reserved for later tasks." icon="dashboard" kicker="Administration" title="Records workspace" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.7fr)]">
        <section aria-labelledby="available-modules" className="admin-panel overflow-hidden">
          <div className="border-b px-5 py-4 sm:px-6"><h2 className="font-bold tracking-tight" id="available-modules">Available record modules</h2><p className="mt-1 text-sm text-muted">Choose a workspace to continue.</p></div>
          <div className="divide-y">
            {recordModules.map((module) => (
              <Link className="group grid gap-4 p-5 hover:bg-[#f7f8f3] sm:grid-cols-[2.75rem_minmax(0,1fr)_auto] sm:items-center sm:px-6" href={module.href} key={module.href}>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-surface-subtle text-primary transition-colors group-hover:bg-accent"><AdminIcon className="h-5 w-5" name={module.icon} /></span>
                <span><span className="block font-bold tracking-tight">{module.title}</span><span className="mt-1 block max-w-xl text-sm leading-6 text-muted">{module.description}</span></span>
                <span aria-hidden="true" className="hidden text-xl text-accent-strong transition-transform group-hover:translate-x-1 sm:block">›</span>
              </Link>
            ))}
          </div>
        </section>

        <aside aria-labelledby="reserved-modules" className="admin-panel p-5 sm:p-6">
          <p className="admin-kicker">Planned work</p>
          <h2 className="mt-3 text-xl font-bold tracking-tight" id="reserved-modules">Reserved modules</h2>
          <p className="mt-2 text-sm leading-6 text-muted">These authenticated routes communicate scope without presenting unfinished functionality as complete.</p>
          <ul className="mt-5 divide-y border-y">
            {reservedModules.map(([title, description, href]) => <li key={href}><Link className="block py-4 hover:text-primary" href={href}><span className="block text-sm font-bold">{title}</span><span className="mt-1 block text-sm leading-5 text-muted">{description}</span></Link></li>)}
          </ul>
        </aside>
      </div>

      <p className="admin-alert-neutral">Record changes remain protected by Administrator authorization, row-level security, validation, and append-only audit history.</p>
    </div>
  );
}
