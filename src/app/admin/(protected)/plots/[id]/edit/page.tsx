import Link from "next/link";
import { notFound } from "next/navigation";

import { getPlot, type PlotOption, type PlotTypeOption } from "@/lib/plots/data";
import { isPlotUuid } from "@/lib/plots/validation";

import { updatePlot } from "../../actions";
import { PlotForm } from "../../plot-form";

export default async function EditPlotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isPlotUuid(id)) notFound();
  const plot = await getPlot(id);
  if (!plot) notFound();
  const site: PlotOption = { id: plot.siteId, label: plot.siteName };
  const area: PlotOption | undefined = plot.areaId && plot.areaName ? { id: plot.areaId, label: plot.areaName } : undefined;
  const sector: PlotOption | undefined = plot.sectorId && plot.sectorLabel ? { id: plot.sectorId, label: plot.sectorLabel } : undefined;
  const plotType: PlotTypeOption | undefined = plot.plotTypeId && plot.plotTypeName && plot.plotTypeCode ? { id: plot.plotTypeId, label: plot.plotTypeName, code: plot.plotTypeCode, capacity: plot.capacity, context: plot.plotTypeCode } : undefined;
  const action = updatePlot.bind(null, plot.id);

  return <div className="grid gap-4">
    <Link className="w-fit font-semibold text-primary underline" href={`/admin/plots/${plot.id}`}>← Back to plot</Link>
    <section className="rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Correction</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Edit plot</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted">Correct the same plot UUID. Occupancy remains derived, shared plot-type capacity remains read-only, and occupied location changes require deliberate confirmation.</p>
      <div className="mt-8"><PlotForm action={action} allowLifecycle cancelHref={`/admin/plots/${plot.id}`} initialArea={area} initialPlotType={plotType} initialSector={sector} initialSite={site} initialValues={{ siteId: plot.siteId, areaId: plot.areaId ?? "", sectorId: plot.sectorId ?? "", plotTypeId: plot.plotTypeId ?? "", plotIdentifier: plot.identifier, state: plot.state }} submitLabel="Save corrections" /></div>
    </section>
  </div>;
}
