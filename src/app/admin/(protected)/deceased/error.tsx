"use client";

export default function DeceasedError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="rounded-2xl border border-red-200 bg-surface p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-red-700">Unable to load records</p>
      <h1 className="mt-3 text-2xl font-semibold">Deceased records are temporarily unavailable</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted">No changes were made. Check the connection and try again.</p>
      <button className="mt-6 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90" onClick={reset} type="button">Try again</button>
    </section>
  );
}
