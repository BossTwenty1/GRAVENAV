import { PageShell } from "@/components/page-shell";
import { SectionPlaceholder } from "@/components/section-placeholder";

export default function NavigatePage() {
  return (
    <PageShell
      eyebrow="Public visitor"
      title="Navigation foundation"
      description="This route is reserved for future GPS-assisted guidance toward a verified gravesite destination."
    >
      <SectionPlaceholder
        title="Navigation is not active"
        description="Browser location, route geometry, accuracy handling, and destination verification will be implemented in later tasks."
        href="/map"
        linkLabel="View map foundation"
      />
    </PageShell>
  );
}
