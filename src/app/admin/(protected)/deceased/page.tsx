import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminStatusBadge, recordStateLabel } from "@/components/admin-record-state";
import { listDeceasedRecords } from "@/lib/deceased/data";
import { DECEASED_PAGE_SIZE, normalizeSearchQuery, parsePage } from "@/lib/deceased/validation";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function pageHref(page: number, search: string) {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/admin/deceased${query ? `?${query}` : ""}`;
}

export default async function DeceasedListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const parameters = await searchParams;
  const search = normalizeSearchQuery(parameters.q);
  const page = parsePage(parameters.page);
  const { records, count } = await listDeceasedRecords(search, page);
  const totalPages = Math.max(1, Math.ceil(count / DECEASED_PAGE_SIZE));

  if (count > 0 && page > totalPages) {
    redirect(pageHref(totalPages, search));
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Records</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Deceased records</h1>
            <p className="mt-3 max-w-2xl leading-7 text-muted">View, search, create, and carefully correct deceased-person information.</p>
          </div>
          <Link className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90" href="/admin/deceased/new">Add deceased record</Link>
        </div>

        <form action="/admin/deceased" className="mt-7 flex flex-col gap-3 sm:flex-row" method="get" role="search">
          <div className="min-w-0 flex-1">
            <label className="sr-only" htmlFor="deceased-search">Search deceased names</label>
            <input className="min-h-12 w-full rounded-lg border bg-white px-4 py-3" defaultValue={search} id="deceased-search" maxLength={100} name="q" placeholder="Search by deceased name" type="search" />
          </div>
          <button className="min-h-12 rounded-lg border bg-white px-5 py-3 font-semibold hover:bg-accent" type="submit">Search records</button>
          {search ? <Link className="inline-flex min-h-12 items-center justify-center rounded-lg px-4 py-3 font-semibold text-primary underline" href="/admin/deceased">Clear search</Link> : null}
        </form>
      </section>

      <section aria-labelledby="results-heading" className="overflow-hidden rounded-2xl border bg-surface shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4 sm:px-6">
          <h2 className="font-semibold" id="results-heading">{search ? `Results for “${search}”` : "All deceased records"}</h2>
          <p className="text-sm text-muted">{count} {count === 1 ? "record" : "records"}</p>
        </div>
        {records.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <h3 className="text-lg font-semibold">{search ? "No matching records" : "No deceased records yet"}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{search ? "Try a different name or clear the search." : "Add the first deceased record when verified information is available."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#f5f7f3] text-xs uppercase tracking-wide text-muted">
                <tr><th className="px-6 py-3" scope="col">Deceased person</th><th className="px-4 py-3" scope="col">Birth date</th><th className="px-4 py-3" scope="col">Death date</th><th className="px-4 py-3" scope="col">State</th><th className="px-4 py-3" scope="col">Last updated</th><th className="px-6 py-3 text-right" scope="col">Actions</th></tr>
              </thead>
              <tbody className="divide-y">
                {records.map((record) => (
                  <tr key={record.id}>
                    <th className="px-6 py-4 font-semibold" scope="row">{record.display_name}</th>
                    <td className="px-4 py-4 text-muted">{formatDate(record.date_of_birth)}</td>
                    <td className="px-4 py-4 text-muted">{formatDate(record.date_of_death)}</td>
                    <td className="px-4 py-4"><AdminStatusBadge tone={record.state}>{recordStateLabel(record.state)}</AdminStatusBadge></td>
                    <td className="px-4 py-4 text-muted">{new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(record.updated_at))}</td>
                    <td className="px-6 py-4 text-right"><Link className="font-semibold text-primary underline" href={`/admin/deceased/${record.id}`}>View record</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {count > 0 ? (
          <nav aria-label="Deceased records pagination" className="flex items-center justify-between gap-4 border-t px-5 py-4 sm:px-6">
            {page > 1 ? <Link className="rounded-lg border px-4 py-2 font-semibold hover:bg-accent" href={pageHref(page - 1, search)}>Previous</Link> : <span />}
            <span className="text-sm text-muted">Page {page} of {totalPages}</span>
            {page < totalPages ? <Link className="rounded-lg border px-4 py-2 font-semibold hover:bg-accent" href={pageHref(page + 1, search)}>Next</Link> : <span />}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
