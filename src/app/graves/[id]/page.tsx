import { PageShell } from "@/components/page-shell";
import { SectionPlaceholder } from "@/components/section-placeholder";

export default function GravesitePage() {
  return (
    <PageShell
      eyebrow="Public visitor"
      title="Gravesite profile foundation"
      description="This route is reserved for a future gravesite profile connected to an approved public record."
    >
      <SectionPlaceholder
        title="Gravesite details are not connected"
        description="No real deceased-person information, plot details, photographs, or coordinates are included in the application foundation."
        href="/search"
        linkLabel="Return to search"
      />
    </PageShell>
  );
}
