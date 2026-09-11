export default function DeceasedLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="grid gap-6">
      <div className="h-48 animate-pulse rounded-2xl border bg-surface" />
      <div className="h-80 animate-pulse rounded-2xl border bg-surface" />
      <span className="sr-only">Loading deceased records…</span>
    </div>
  );
}
