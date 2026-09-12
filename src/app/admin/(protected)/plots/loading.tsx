export default function PlotsLoading() {
  return <div aria-busy="true" aria-live="polite" className="grid gap-6"><div className="h-52 animate-pulse rounded-2xl border bg-surface" /><div className="h-80 animate-pulse rounded-2xl border bg-surface" /><span className="sr-only">Loading plots…</span></div>;
}
