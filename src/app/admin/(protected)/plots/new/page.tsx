import Link from "next/link";

import { createPlot } from "../actions";
import { PlotForm } from "../plot-form";

export const metadata = { title: "Add plot" };

export default function NewPlotPage() {
  return <div className="grid gap-4">
    <Link className="admin-text-link w-fit" href="/admin/plots">← Back to plots</Link>
    <section className="admin-panel p-5 sm:p-8">
      <p className="admin-kicker">New plot</p><h1 className="admin-page-title mt-2">Add a cemetery plot</h1>
      <p className="admin-page-description mt-3">Create one plot inside existing hierarchy and plot-type records. This form never creates or changes shared configuration as a side effect.</p>
      <div className="mt-8"><PlotForm action={createPlot} initialValues={{ siteId: "", areaId: "", sectorId: "", plotTypeId: "", plotIdentifier: "", state: "active" }} submitLabel="Add plot" /></div>
    </section>
  </div>;
}
