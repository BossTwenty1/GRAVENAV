import Link from "next/link";
import { redirect } from "next/navigation";

import { listInterments } from "@/lib/interments/data";
import {
  INTERMENT_PAGE_SIZE,
  normalizeIntermentSearch,
  parseIntermentPage,
  parseIntermentState,
} from "@/lib/interments/validation";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function locationText(record: Awaited<ReturnType<typeof listInterments>>["records"][number]) {
  return [record.siteName, record.areaName, record.sectorLabel, record.plotIdentifier].filter(Boolean).join(" · ");
}

function pageHref(page: number, search: string, state: "active" | "archived" | "all") {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (state !== "all") params.set("state", state);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/admin/interments${query ? `?${query}` : ""}`;
}

export default async function IntermentListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[]; state?: string | string[] }>;
}) {
  const parameters = await searchParams;
  const search = normalizeIntermentSearch(parameters.q);
  const state = parseIntermentState(parameters.state);
  const page = parseIntermentPage(parameters.page);
  const { records, count } = await listInterments(search, state, page);
  const totalPages = Math.max(1, Math.ceil(count / INTERMENT_PAGE_SIZE));

  if (count > 0 && page > totalPages) redirect(pageHref(totalPages, search, state));

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Burial records</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Interments</h1>
            <p className="mt-3 max-w-2xl leading-7 text-muted">View, search, create, and carefully correct the relationship between a deceased record and a plot.</p>
          </div>
          <Link className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90" href="/admin/interments/new">Add interment</Link>
        </div>

        <form action="/admin/interments" className="mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_auto]" method="get" role="search">
          <div>
            <label className="sr-only" htmlFor="interment-search">Search deceased names</label>
            <input className="min-h-12 w-full rounded-lg border bg-white px-4 py-3" defaultValue={search} id="interment-search" maxLength={100} name="q" placeholder="Search by deceased name" type="search" />
          </div>
          <div>
            <label className="sr-only" htmlFor="interment-state">Filter by lifecycle state</label>
            <select className="min-h-12 w-full rounded-lg border bg-white px-3" defaultValue={state} id="interment-state" name="state"><option value="all">All states</option><option value="active">Active</option><option value="archived">Archived</option></select>
          </div>
          <button className="min-h-12 rounded-lg border bg-white px-5 py-3 font-semibold hover:bg-accent" type="submit">Apply</button>
        </form>
        {search || state !== "all" ? <Link className="mt-3 inline-flex font-semibold text-primary underline" href="/admin/interments">Clear filters</Link> : null}
      </section>

      <section aria-labelledby="interment-results" className="overflow-hidden rounded-2xl border bg-surface shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4 sm:px-6">
          <h2 className="font-semibold" id="interment-results">{search ? `Results for “${search}”` : state === "all" ? "All interments" : `${state === "active" ? "Active" : "Archived"} interments`}</h2>
          <p className="text-sm text-muted">{count} {count === 1 ? "record" : "records"}</p>
        </div>
        {records.length === 0 ? (
          <div className="px-6 py-14 text-center"><h3 className="text-lg font-semibold">{search || state !== "all" ? "No matching interments" : "No interments yet"}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{search || state !== "all" ? "Adjust the name or lifecycle filter and try again." : "Add the first interment after selecting verified deceased and plot records."}</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-[#f5f7f3] text-xs uppercase tracking-wide text-muted"><tr><th className="px-6 py-3" scope="col">Deceased</th><th className="px-4 py-3" scope="col">Location</th><th className="px-4 py-3" scope="col">Interment date</th><th className="px-4 py-3" scope="col">State</th><th className="px-4 py-3" scope="col">Updated</th><th className="px-6 py-3 text-right" scope="col">Actions</th></tr></thead>
              <tbody className="divide-y">{records.map((record) => <tr key={record.id}><th className="px-6 py-4 font-semibold" scope="row">{record.deceasedName}</th><td className="max-w-sm px-4 py-4 text-muted">{locationText(record)}</td><td className="px-4 py-4 text-muted">{formatDate(record.intermentDate)}</td><td className="px-4 py-4 capitalize">{record.state}</td><td className="px-4 py-4 text-muted">{new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(record.updatedAt))}</td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-3"><Link className="font-semibold text-primary underline" href={`/admin/interments/${record.id}`}>View</Link><Link className="font-semibold text-primary underline" href={`/admin/interments/${record.id}/edit`}>Edit</Link></div></td></tr>)}</tbody>
            </table>
          </div>
        )}
        {count > 0 ? <nav aria-label="Interment pagination" className="flex items-center justify-between gap-4 border-t px-5 py-4 sm:px-6">{page > 1 ? <Link className="rounded-lg border px-4 py-2 font-semibold hover:bg-accent" href={pageHref(page - 1, search, state)}>Previous</Link> : <span />}<span className="text-sm text-muted">Page {page} of {totalPages}</span>{page < totalPages ? <Link className="rounded-lg border px-4 py-2 font-semibold hover:bg-accent" href={pageHref(page + 1, search, state)}>Next</Link> : <span />}</nav> : null}
      </section>
    </div>
  );
}
