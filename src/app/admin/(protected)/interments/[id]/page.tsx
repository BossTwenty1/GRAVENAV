import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminStatusBadge, capacityLabel, occupancyLabel, recordStateLabel } from "@/components/admin-record-state";
import { getInterment } from "@/lib/interments/data";
import { isUuid } from "@/lib/interments/validation";

export const metadata = { title: "Interment record" };

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

export default async function IntermentDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; updated?: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const record = await getInterment(id);
  if (!record) notFound();
  const status = await searchParams;
  const location = [record.siteName, record.areaName, record.sectorLabel].filter(Boolean).join(" · ");

  return (
    <div className="grid gap-4">
      <Link className="admin-text-link w-fit" href="/admin/interments">← Back to interments</Link>
      {status.created === "1" || status.updated === "1" ? <p aria-live="polite" className="admin-alert-success font-semibold" role="status">{status.created === "1" ? "Interment created successfully." : "Interment updated successfully."}</p> : null}
      <section className="admin-panel p-5 sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="admin-kicker">Interment record</p><h1 className="admin-page-title mt-2">{record.deceasedName}</h1><p className="mt-2 text-muted">Plot {record.plotIdentifier}</p></div><Link className="admin-button-primary" href={`/admin/interments/${record.id}/edit`}>Edit interment</Link></div>
        <dl className="admin-detail-grid mt-8 grid gap-6 border-t pt-6 sm:grid-cols-2">
          <div><dt className="text-sm font-semibold text-muted">Deceased record</dt><dd className="mt-1 text-lg"><Link className="admin-text-link font-semibold" href={`/admin/deceased/${record.deceasedPersonId}`}>{record.deceasedName}</Link></dd><dd className="mt-1 text-sm text-muted">Born {formatDate(record.deceasedBirthDate)} · Died {formatDate(record.deceasedDeathDate)}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Interment date</dt><dd className="mt-1 text-lg">{formatDate(record.intermentDate)}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Cemetery location</dt><dd className="mt-1 text-lg">{location}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Plot</dt><dd className="mt-1 text-lg"><Link className="admin-text-link font-semibold" href={`/admin/plots/${record.plotId}`}>{record.plotIdentifier}</Link></dd><dd className="mt-1 text-sm text-muted">Normalized plot key: {record.lotKey}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Plot occupancy</dt><dd className="mt-1"><AdminStatusBadge>{occupancyLabel(record.occupancyStatus)}</AdminStatusBadge> <span className="text-sm text-muted">({record.activeIntermentCount} active)</span></dd><dd className="mt-1 text-sm text-muted">Capacity: {capacityLabel(record.capacity)}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Lifecycle state</dt><dd className="mt-1"><AdminStatusBadge tone={record.state}>{recordStateLabel(record.state)}</AdminStatusBadge></dd></div>
          <div><dt className="text-sm font-semibold text-muted">Interment type</dt><dd className="mt-1">{record.intermentType ?? "Not recorded"}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Position sequence</dt><dd className="mt-1">{record.positionSequence ?? "Not recorded"}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Permanence status</dt><dd className="mt-1">{record.permanenceStatus ?? "Not recorded"}</dd></div>
          <div><dt className="text-sm font-semibold text-muted">Record timestamps</dt><dd className="mt-1 text-sm">Created {formatTimestamp(record.createdAt)}<br />Updated {formatTimestamp(record.updatedAt)}</dd></div>
        </dl>
        <p className="admin-alert-neutral mt-8">Commercial status remains separate from physical occupancy. Historical interments cannot be hard-deleted through the Administrator interface.</p>
      </section>
    </div>
  );
}
