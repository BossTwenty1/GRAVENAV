import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

const foundationCards = [
  {
    title: "Find a gravesite",
    description: "A future search flow will help visitors locate an approved public record.",
    href: "/search",
  },
  {
    title: "Cemetery location assistance",
    description: "The map foundation is ready for validated cemetery spatial data later.",
    href: "/map",
  },
  {
    title: "GPS-assisted navigation",
    description: "Location and guidance will be added only after destinations and accuracy are verified.",
    href: "/navigate/foundation",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Cemetery location assistance</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">Find a gravesite with clarity and care.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              GRAVENAV is being prepared as a responsive web application for gravesite discovery, cemetery location assistance, and future GPS-assisted navigation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90" href="/search">
                Explore search foundation
              </Link>
              <Link className="rounded-lg border bg-surface px-5 py-3 font-semibold text-foreground hover:bg-accent" href="/admin">
                View admin shell
              </Link>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-6 text-muted">Foundation preview only. No real cemetery records, coordinates, or navigation are connected yet.</p>
          </div>
          <div className="rounded-3xl border bg-surface p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Application foundation</p>
            <div className="mt-6 grid gap-4">
              {foundationCards.map((card) => (
                <Link className="rounded-2xl border p-5 transition hover:border-primary hover:bg-accent" href={card.href} key={card.href}>
                  <h2 className="font-semibold">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">{card.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
