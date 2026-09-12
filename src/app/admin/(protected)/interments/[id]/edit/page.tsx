import Link from "next/link";
import { notFound } from "next/navigation";

import { getInterment, type DeceasedPickerOption, type PlotPickerOption } from "@/lib/interments/data";
import { isUuid } from "@/lib/interments/validation";

import { updateInterment } from "../../actions";
import { IntermentForm } from "../../interment-form";

export default async function EditIntermentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const record = await getInterment(id);
  if (!record) notFound();
  const action = updateInterment.bind(null, record.id);
  const deceased: DeceasedPickerOption = { id: record.deceasedPersonId, displayName: record.deceasedName, birthDate: record.deceasedBirthDate, deathDate: record.deceasedDeathDate, state: record.deceasedState };
  const plot: PlotPickerOption = { id: record.plotId, identifier: record.plotIdentifier, lotKey: record.lotKey, siteName: record.siteName, areaName: record.areaName, sectorLabel: record.sectorLabel, capacity: record.capacity, activeIntermentCount: record.activeIntermentCount, occupancyStatus: record.occupancyStatus, state: record.plotState };

  return (
    <div className="grid gap-4">
      <Link className="w-fit font-semibold text-primary underline" href={`/admin/interments/${record.id}`}>← Back to interment</Link>
      <section className="rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Correction</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Edit interment</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">Correct the existing record without changing its UUID. Plot moves and reactivation recheck occupancy and capacity.</p>
        <div className="mt-8"><IntermentForm action={action} allowLifecycle cancelHref={`/admin/interments/${record.id}`} initialDeceased={deceased} initialPlot={plot} initialValues={{ deceasedPersonId: record.deceasedPersonId, plotId: record.plotId, intermentDate: record.intermentDate ?? "", intermentType: record.intermentType ?? "", positionSequence: record.positionSequence?.toString() ?? "", permanenceStatus: record.permanenceStatus ?? "", state: record.state }} submitLabel="Save corrections" /></div>
      </section>
    </div>
  );
}
