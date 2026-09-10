import { PageShell } from "@/components/page-shell";
import { SectionPlaceholder } from "@/components/section-placeholder";

export default function MapPage() {
  return (
    <PageShell
      eyebrow="Public visitor"
      title="Cemetery map foundation"
      description="The map route is ready for a future Leaflet interface after validated cemetery spatial data is available."
    >
      <SectionPlaceholder
        title="Map data is not configured"
        description="This foundation does not invent cemetery boundaries, plots, paths, coordinates, or GPS performance."
      />
    </PageShell>
  );
}
