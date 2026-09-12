"use client";

export function AdminRecordError({ description, heading, reset }: { description: string; heading: string; reset: () => void }) {
  return <section aria-labelledby="admin-record-error-heading" className="admin-panel p-6 sm:p-8" role="alert"><p className="admin-kicker text-red-700">Unable to load records</p><h1 className="admin-page-title mt-3" id="admin-record-error-heading">{heading}</h1><p className="admin-page-description mt-3">{description}</p><button className="admin-button-primary mt-6" onClick={reset} type="button">Try again</button></section>;
}

export function AdminRecordsLoading({ label }: { label: string }) {
  return <div aria-busy="true" aria-live="polite" className="grid gap-5"><div className="admin-panel h-44 animate-pulse bg-surface-subtle" /><div className="admin-panel h-80 animate-pulse bg-surface-subtle" /><span className="sr-only">{label}</span></div>;
}
