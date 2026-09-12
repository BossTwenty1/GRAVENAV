import Link from "next/link";

import { createPlot } from "../actions";
import { PlotForm } from "../plot-form";

export default function NewPlotPage() {
  return <div className="grid gap-4">
    <Link className="w-fit font-semibold text-primary underline" href="/admin/plots">← Back to plots</Link>
    <section className="rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">New record</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Add plot</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted">Create one plot inside existing hierarchy and plot-type records. This form never creates or changes shared configuration as a side effect.</p>
      <div className="mt-8"><PlotForm action={createPlot} initialValues={{ siteId: "", areaId: "", sectorId: "", plotTypeId: "", plotIdentifier: "", state: "active" }} submitLabel="Add plot" /></div>
    </section>
  </div>;
}
