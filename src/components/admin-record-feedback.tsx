"use client";

export function AdminRecordError({ description, heading, reset }: { description: string; heading: string; reset: () => void }) {
  return <section aria-labelledby="admin-record-error-heading" className="rounded-2xl border border-red-200 bg-surface p-6 shadow-sm sm:p-8" role="alert"><p className="text-sm font-semibold uppercase tracking-[0.14em] text-red-700">Unable to load records</p><h1 className="mt-3 text-2xl font-semibold" id="admin-record-error-heading">{heading}</h1><p className="mt-3 max-w-2xl leading-7 text-muted">{description}</p><button className="mt-6 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" onClick={reset} type="button">Try again</button></section>;
}

export function AdminRecordsLoading({ label }: { label: string }) {
  return <div aria-busy="true" aria-live="polite" className="grid gap-6"><div className="h-48 animate-pulse rounded-2xl border bg-surface" /><div className="h-80 animate-pulse rounded-2xl border bg-surface" /><span className="sr-only">{label}</span></div>;
}
