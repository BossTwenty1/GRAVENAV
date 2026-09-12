import Link from "next/link";
import { notFound } from "next/navigation";

import { getInterment, type DeceasedPickerOption, type PlotPickerOption } from "@/lib/interments/data";
import { isUuid } from "@/lib/interments/validation";

import { updateInterment } from "../../actions";
import { IntermentForm } from "../../interment-form";

export const metadata = { title: "Edit interment" };

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
      <Link className="admin-text-link w-fit" href={`/admin/interments/${record.id}`}>← Back to interment</Link>
      <section className="admin-panel p-5 sm:p-8">
        <p className="admin-kicker">Interment correction</p>
        <h1 className="admin-page-title mt-2">Edit interment</h1>
        <p className="admin-page-description mt-3">Correct the existing record without changing its UUID. Plot moves and reactivation recheck occupancy and capacity.</p>
        <div className="mt-8"><IntermentForm action={action} allowLifecycle cancelHref={`/admin/interments/${record.id}`} initialDeceased={deceased} initialPlot={plot} initialValues={{ deceasedPersonId: record.deceasedPersonId, plotId: record.plotId, intermentDate: record.intermentDate ?? "", intermentType: record.intermentType ?? "", positionSequence: record.positionSequence?.toString() ?? "", permanenceStatus: record.permanenceStatus ?? "", state: record.state }} submitLabel="Save corrections" /></div>
      </section>
    </div>
  );
}
