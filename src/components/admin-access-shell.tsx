import Link from "next/link";
import type { ReactNode } from "react";

import { GravenavMark } from "@/components/gravenav-mark";

export function AdminAccessShell({ children, description, title }: { children: ReactNode; description: string; title: string }) {
  return (
    <main className="grid min-h-screen bg-surface lg:grid-cols-[minmax(20rem,0.8fr)_minmax(28rem,1.2fr)]">
      <section className="relative hidden overflow-hidden bg-primary px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="absolute -right-24 top-1/4 h-96 w-96 rounded-full border border-white/8" />
        <div aria-hidden="true" className="absolute right-16 top-[38%] h-52 w-52 rounded-full border border-white/8" />
        <Link className="relative w-fit text-white" href="/"><GravenavMark inverse /></Link>
        <div className="relative max-w-md pb-6">
          <p className="text-sm font-semibold text-white/60">Cemetery record stewardship</p>
          <p className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.035em]">Clear records support calm, reliable guidance.</p>
          <p className="mt-4 max-w-sm leading-7 text-white/68">The administration area is limited to explicitly approved accounts and preserves the history behind every change.</p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-background px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link className="mb-10 inline-flex text-primary lg:hidden" href="/"><GravenavMark /></Link>
          <p className="admin-kicker">Administrator access</p>
          <h1 className="admin-page-title mt-3">{title}</h1>
          <p className="admin-page-description mt-4">{description}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
