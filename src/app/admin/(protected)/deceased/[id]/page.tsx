import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminStatusBadge, recordStateLabel } from "@/components/admin-record-state";
import { getDeceasedRecord } from "@/lib/deceased/data";

export const metadata = { title: "Deceased record" };

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export default async function DeceasedDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; updated?: string }> }) {
  const { id } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(id)) notFound();

  const record = await getDeceasedRecord(id);
  if (!record) notFound();
  const status = await searchParams;

  return (
    <div className="grid gap-4">
      <Link className="admin-text-link w-fit" href="/admin/deceased">← Back to deceased records</Link>
      {status.created === "1" || status.updated === "1" ? <p aria-live="polite" className="admin-alert-success font-semibold" role="status">{status.created === "1" ? "Deceased record created successfully." : "Deceased record updated successfully."}</p> : null}
      <section className="admin-panel p-5 sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div><p className="admin-kicker">Deceased record</p><h1 className="admin-page-title mt-2">{record.display_name}</h1></div>
          <Link className="admin-button-primary" href={`/admin/deceased/${record.id}/edit`}>Edit record</Link>
        </div>
        <dl className="admin-detail-grid mt-8 grid gap-6 border-t pt-6 sm:grid-cols-2">
          <div><dt className="text-sm font-semibold text-muted">Date of birth</dt><dd className="mt-1 text-lg">{formatDate(record.date_of_birth)}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Date of death</dt><dd className="mt-1 text-lg">{formatDate(record.date_of_death)}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Lifecycle state</dt><dd className="mt-1"><AdminStatusBadge tone={record.state}>{recordStateLabel(record.state)}</AdminStatusBadge></dd></div>
          <div><dt className="text-sm font-semibold text-muted">Last updated</dt><dd className="mt-1">{new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeStyle: "short" }).format(new Date(record.updated_at))}</dd></div>
        </dl>
        <p className="admin-alert-neutral mt-8">Historical deceased records cannot be hard-deleted through the Administrator interface.</p>
      </section>
      <section className="admin-panel p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-xl font-semibold">Related interments</h2><p className="mt-1 text-sm text-muted">Read-only context; use the interment workflow for corrections.</p></div>
          <Link className="admin-text-link" href="/admin/interments">Open interment management</Link>
        </div>
        {record.relatedInterments.length === 0 ? <p className="admin-alert-neutral mt-6">No interments are linked to this deceased record.</p> : <ul className="mt-6 divide-y rounded-xl border">{record.relatedInterments.map((interment) => <li className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" key={interment.id}><div><div className="flex flex-wrap items-center gap-2"><strong>{interment.plotIdentifier}</strong><AdminStatusBadge tone={interment.state}>{recordStateLabel(interment.state)}</AdminStatusBadge></div><p className="mt-1 text-sm text-muted">{[interment.siteName, interment.areaName, interment.sectorLabel].filter(Boolean).join(" · ")} · Interment date: {formatDate(interment.intermentDate)}</p></div><div className="flex flex-wrap gap-3"><Link className="admin-text-link" href={`/admin/interments/${interment.id}`}>View interment</Link><Link className="admin-text-link" href={`/admin/plots/${interment.plotId}`}>View plot</Link></div></li>)}</ul>}
        {record.relatedInterments.length === 25 ? <p className="mt-3 text-sm text-muted">Showing the first 25 related interments.</p> : null}
      </section>
    </div>
  );
}
