import { PageShell } from "@/components/page-shell";
import { SectionPlaceholder } from "@/components/section-placeholder";

export default function SearchPage() {
  return (
    <PageShell
      eyebrow="Public visitor"
      title="Search foundation"
      description="The future deceased-person search will be connected to approved public records in a later implementation task."
    >
      <SectionPlaceholder
        title="No records are connected yet"
        description="This foundation intentionally contains no real names, burial records, or client data. Search behavior will be added after the data model and privacy rules are implemented."
      />
    </PageShell>
  );
}
