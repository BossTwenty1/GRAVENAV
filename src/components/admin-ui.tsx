import Link from "next/link";
import type { ReactNode } from "react";

export type AdminIconName = "person" | "interment" | "plot" | "search" | "dashboard";

export function AdminIcon({ className = "", name }: { className?: string; name: AdminIconName }) {
  const paths: Record<AdminIconName, ReactNode> = {
    person: <><circle cx="12" cy="8" r="3.25" /><path d="M5.5 20c.7-4.5 2.8-6.75 6.5-6.75s5.8 2.25 6.5 6.75" /></>,
    interment: <><path d="M5 6h14M5 12h14M5 18h8" /><circle cx="18" cy="18" r="2" /></>,
    plot: <><path d="m4 7 6-3 5 3 5-2v13l-5 2-5-3-6 3V7Z" /><path d="M10 4v13M15 7v13" /></>,
    search: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4.5 4.5" /></>,
    dashboard: <><rect height="6" rx="1" width="6" x="4" y="4" /><rect height="6" rx="1" width="6" x="14" y="4" /><rect height="6" rx="1" width="6" x="4" y="14" /><rect height="6" rx="1" width="6" x="14" y="14" /></>,
  };

  return (
    <svg aria-hidden="true" className={className} fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.65" viewBox="0 0 24 24" width="24">
      {paths[name]}
    </svg>
  );
}

export function AdminPageHeader({ action, children, description, icon, kicker, title }: { action?: ReactNode; children?: ReactNode; description: string; icon: AdminIconName; kicker: string; title: string }) {
  return (
    <section className="admin-panel overflow-hidden">
      <div className="flex flex-col justify-between gap-6 p-5 sm:flex-row sm:items-start sm:p-7">
        <div className="flex min-w-0 gap-4 sm:gap-5">
          <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-xl border bg-surface-subtle text-primary sm:grid"><AdminIcon name={icon} /></span>
          <div><p className="admin-kicker">{kicker}</p><h1 className="admin-page-title mt-2">{title}</h1><p className="admin-page-description mt-3">{description}</p></div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children ? <div className="border-t bg-[#fafaf6] p-5 sm:p-6">{children}</div> : null}
    </section>
  );
}

export function AdminEmptyState({ description, heading, icon }: { description: string; heading: string; icon: AdminIconName }) {
  return <div className="admin-empty-state"><span className="admin-empty-icon"><AdminIcon className="h-5 w-5" name={icon} /></span><h3 className="mt-4 text-lg font-bold tracking-tight">{heading}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p></div>;
}

export function AdminPagination({ label, nextHref, page, previousHref, totalPages }: { label: string; nextHref?: string; page: number; previousHref?: string; totalPages: number }) {
  const disabledClass = "inline-flex min-h-11 min-w-[5.75rem] items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold text-muted opacity-45";
  return <nav aria-label={label} className="flex items-center justify-between gap-3 border-t px-4 py-4 sm:px-6">{previousHref ? <Link className="admin-button-secondary min-w-[5.75rem]" href={previousHref}>Previous</Link> : <span aria-disabled="true" className={disabledClass}>Previous</span>}<span className="text-center text-sm font-medium text-muted">Page <strong className="text-foreground">{page}</strong> of {totalPages}</span>{nextHref ? <Link className="admin-button-secondary min-w-[5.75rem]" href={nextHref}>Next</Link> : <span aria-disabled="true" className={disabledClass}>Next</span>}</nav>;
}
