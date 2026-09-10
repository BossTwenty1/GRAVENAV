import Link from "next/link";

export function SectionPlaceholder({
  title,
  description,
  href = "/",
  linkLabel = "Return home",
}: {
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <section className="max-w-2xl rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Foundation placeholder</p>
      <h2 className="mt-3 text-2xl font-semibold">{title}</h2>
      <p className="mt-3 leading-7 text-muted">{description}</p>
      <Link className="mt-6 inline-flex rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90" href={href}>
        {linkLabel}
      </Link>
    </section>
  );
}
