"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";

import type { DeceasedPickerOption, PlotPickerOption } from "@/lib/interments/data";
import type { IntermentFormValues } from "@/lib/interments/validation";

import {
  searchDeceasedPicker,
  searchPlotPicker,
  type IntermentFormState,
} from "./actions";

type IntermentAction = (state: IntermentFormState, formData: FormData) => Promise<IntermentFormState>;

function formatDate(value: string | null) {
  if (!value) return "not recorded";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function plotContext(plot: PlotPickerOption) {
  return [plot.siteName, plot.areaName, plot.sectorLabel].filter(Boolean).join(" · ");
}

export function IntermentForm({
  action,
  initialValues,
  initialDeceased,
  initialPlot,
  submitLabel,
  cancelHref = "/admin/interments",
  allowLifecycle = false,
}: {
  action: IntermentAction;
  initialValues: IntermentFormValues;
  initialDeceased?: DeceasedPickerOption;
  initialPlot?: PlotPickerOption;
  submitLabel: string;
  cancelHref?: string;
  allowLifecycle?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? initialValues;
  const [selectedDeceased, setSelectedDeceased] = useState<DeceasedPickerOption | null>(initialDeceased ?? null);
  const [selectedPlot, setSelectedPlot] = useState<PlotPickerOption | null>(initialPlot ?? null);
  const [deceasedResults, setDeceasedResults] = useState<DeceasedPickerOption[]>([]);
  const [plotResults, setPlotResults] = useState<PlotPickerOption[]>([]);
  const [deceasedError, setDeceasedError] = useState<string>();
  const [plotError, setPlotError] = useState<string>();
  const [deceasedPending, startDeceasedSearch] = useTransition();
  const [plotPending, startPlotSearch] = useTransition();

  return (
    <form action={formAction} className="grid gap-7" noValidate>
      <section aria-labelledby="deceased-picker-heading" className="rounded-xl border p-5">
        <h2 className="font-semibold" id="deceased-picker-heading">Deceased record <span className="text-red-700">(required)</span></h2>
        <p className="mt-1 text-sm leading-6 text-muted">Search by name, compare available dates, then explicitly select the correct UUID-backed record.</p>
        <input name="deceasedPersonId" type="hidden" value={selectedDeceased?.id ?? ""} />
        {selectedDeceased ? (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="font-semibold text-green-950">Selected: {selectedDeceased.displayName}</p>
            <p className="mt-1 text-sm text-green-900">Born {formatDate(selectedDeceased.birthDate)} · Died {formatDate(selectedDeceased.deathDate)}{selectedDeceased.state === "archived" ? " · Archived" : ""}</p>
            <button className="mt-2 text-sm font-semibold text-primary underline" disabled={pending} onClick={() => setSelectedDeceased(null)} type="button">Change selection</button>
          </div>
        ) : (
          <div className="mt-3 grid gap-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="deceased-picker-search">Search deceased records</label>
              <input className="min-h-12 min-w-0 flex-1 rounded-lg border bg-white px-3" id="deceased-picker-search" maxLength={100} placeholder="Search deceased name" type="search" />
              <button className="min-h-12 rounded-lg border bg-white px-4 font-semibold hover:bg-accent disabled:opacity-60" disabled={deceasedPending || pending} onClick={() => {
                const input = document.getElementById("deceased-picker-search") as HTMLInputElement;
                startDeceasedSearch(async () => {
                  const result = await searchDeceasedPicker(input.value);
                  setDeceasedResults(result.options);
                  setDeceasedError(result.error);
                });
              }} type="button">{deceasedPending ? "Searching…" : "Search"}</button>
            </div>
            {deceasedError ? <p className="text-sm text-red-700" role="alert">{deceasedError}</p> : null}
            {deceasedResults.length ? <ul className="grid gap-2">{deceasedResults.map((option) => (
              <li className="flex flex-col justify-between gap-2 rounded-lg border bg-white p-3 sm:flex-row sm:items-center" key={option.id}>
                <span><strong>{option.displayName}</strong><span className="mt-1 block text-sm text-muted">Born {formatDate(option.birthDate)} · Died {formatDate(option.deathDate)}</span></span>
                <button className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-accent" onClick={() => setSelectedDeceased(option)} type="button">Select record</button>
              </li>
            ))}</ul> : null}
          </div>
        )}
        {state.fieldErrors?.deceasedPersonId ? <p className="mt-2 text-sm text-red-700" role="alert">{state.fieldErrors.deceasedPersonId}</p> : null}
      </section>

      <section aria-labelledby="plot-picker-heading" className="rounded-xl border p-5">
        <h2 className="font-semibold" id="plot-picker-heading">Plot <span className="text-red-700">(required)</span></h2>
        <p className="mt-1 text-sm leading-6 text-muted">Search the normalized plot identifier or lot key. Commercial status is not used as burial occupancy.</p>
        <input name="plotId" type="hidden" value={selectedPlot?.id ?? ""} />
        {selectedPlot ? (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="font-semibold text-green-950">Selected: {selectedPlot.identifier}</p>
            <p className="mt-1 text-sm text-green-900">{plotContext(selectedPlot)} · {selectedPlot.activeIntermentCount} active · Capacity {selectedPlot.capacity ?? "not configured"}{selectedPlot.state === "archived" ? " · Archived" : ""}</p>
            <button className="mt-2 text-sm font-semibold text-primary underline" disabled={pending} onClick={() => setSelectedPlot(null)} type="button">Change selection</button>
          </div>
        ) : (
          <div className="mt-3 grid gap-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="plot-picker-search">Search plots</label>
              <input className="min-h-12 min-w-0 flex-1 rounded-lg border bg-white px-3" id="plot-picker-search" maxLength={100} placeholder="Search plot identifier" type="search" />
              <button className="min-h-12 rounded-lg border bg-white px-4 font-semibold hover:bg-accent disabled:opacity-60" disabled={plotPending || pending} onClick={() => {
                const input = document.getElementById("plot-picker-search") as HTMLInputElement;
                startPlotSearch(async () => {
                  const result = await searchPlotPicker(input.value);
                  setPlotResults(result.options);
                  setPlotError(result.error);
                });
              }} type="button">{plotPending ? "Searching…" : "Search"}</button>
            </div>
            {plotError ? <p className="text-sm text-red-700" role="alert">{plotError}</p> : null}
            {plotResults.length ? <ul className="grid gap-2">{plotResults.map((option) => (
              <li className="flex flex-col justify-between gap-2 rounded-lg border bg-white p-3 sm:flex-row sm:items-center" key={option.id}>
                <span><strong>{option.identifier}</strong><span className="mt-1 block text-sm text-muted">{plotContext(option)} · {option.activeIntermentCount} active · Capacity {option.capacity ?? "not configured"}</span></span>
                <button className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-accent" onClick={() => setSelectedPlot(option)} type="button">Select plot</button>
              </li>
            ))}</ul> : null}
          </div>
        )}
        {state.fieldErrors?.plotId ? <p className="mt-2 text-sm text-red-700" role="alert">{state.fieldErrors.plotId}</p> : null}
      </section>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold" htmlFor="intermentDate">Interment date <span className="font-normal text-muted">(optional)</span></label>
          <input aria-describedby={state.fieldErrors?.intermentDate ? "intermentDate-error" : undefined} aria-invalid={Boolean(state.fieldErrors?.intermentDate)} className="mt-2 w-full rounded-lg border bg-white px-3 py-3" defaultValue={values.intermentDate} disabled={pending} id="intermentDate" name="intermentDate" type="date" />
          {state.fieldErrors?.intermentDate ? <p className="mt-2 text-sm text-red-700" id="intermentDate-error">{state.fieldErrors.intermentDate}</p> : null}
        </div>
        <div>
          <label className="block text-sm font-semibold" htmlFor="positionSequence">Position sequence <span className="font-normal text-muted">(optional)</span></label>
          <input aria-describedby={state.fieldErrors?.positionSequence ? "positionSequence-error" : undefined} aria-invalid={Boolean(state.fieldErrors?.positionSequence)} className="mt-2 w-full rounded-lg border bg-white px-3 py-3" defaultValue={values.positionSequence} disabled={pending} id="positionSequence" min="1" name="positionSequence" step="1" type="number" />
          {state.fieldErrors?.positionSequence ? <p className="mt-2 text-sm text-red-700" id="positionSequence-error">{state.fieldErrors.positionSequence}</p> : null}
        </div>
        <div>
          <label className="block text-sm font-semibold" htmlFor="intermentType">Interment type <span className="font-normal text-muted">(optional)</span></label>
          <input aria-describedby={state.fieldErrors?.intermentType ? "intermentType-help intermentType-error" : "intermentType-help"} aria-invalid={Boolean(state.fieldErrors?.intermentType)} className="mt-2 w-full rounded-lg border bg-white px-3 py-3" defaultValue={values.intermentType} disabled={pending} id="intermentType" maxLength={100} name="intermentType" type="text" />
          <p className="mt-1 text-xs text-muted" id="intermentType-help">Use only a verified existing description; no cemetery-specific categories are inferred.</p>
          {state.fieldErrors?.intermentType ? <p className="mt-2 text-sm text-red-700" id="intermentType-error">{state.fieldErrors.intermentType}</p> : null}
        </div>
        <div>
          <label className="block text-sm font-semibold" htmlFor="permanenceStatus">Permanence status <span className="font-normal text-muted">(optional)</span></label>
          <input aria-describedby={state.fieldErrors?.permanenceStatus ? "permanenceStatus-error" : undefined} aria-invalid={Boolean(state.fieldErrors?.permanenceStatus)} className="mt-2 w-full rounded-lg border bg-white px-3 py-3" defaultValue={values.permanenceStatus} disabled={pending} id="permanenceStatus" maxLength={100} name="permanenceStatus" type="text" />
          {state.fieldErrors?.permanenceStatus ? <p className="mt-2 text-sm text-red-700" id="permanenceStatus-error">{state.fieldErrors.permanenceStatus}</p> : null}
        </div>
      </div>

      {allowLifecycle ? <div>
        <label className="block text-sm font-semibold" htmlFor="state">Lifecycle state</label>
        <select className="mt-2 w-full rounded-lg border bg-white px-3 py-3 sm:max-w-sm" defaultValue={values.state} disabled={pending} id="state" name="state"><option value="active">Active</option><option value="archived">Archived</option></select>
        <p className="mt-1 text-sm text-muted">Archived interments remain in history and no longer count toward derived occupancy.</p>
      </div> : <input name="state" type="hidden" value="active" />}

      {state.duplicate ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">Review the existing interment for {state.duplicate.deceasedName} dated {formatDate(state.duplicate.intermentDate)}. Exact duplicates cannot be deliberately bypassed. <Link className="font-semibold underline" href={`/admin/interments/${state.duplicate.id}`} target="_blank">Open record</Link></p> : null}

      {state.occupancyWarning ? (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4" role="alert">
          <h2 className="font-semibold text-amber-950">Confirm placement in an occupied plot</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">{state.occupancyWarning.plot.identifier} currently has {state.occupancyWarning.activeIntermentCount} active {state.occupancyWarning.activeIntermentCount === 1 ? "interment" : "interments"}. Configured capacity: {state.occupancyWarning.plot.capacity ?? "not configured"}. Multiple interments are supported, but this placement requires deliberate confirmation.</p>
          {state.occupancyWarning.existingInterments.length ? <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">{state.occupancyWarning.existingInterments.map((item) => <li key={item.id}>{item.deceasedName} — {formatDate(item.intermentDate)}</li>)}</ul> : null}
          <input name="occupancyConfirmation" type="hidden" value={state.confirmationKey} />
        </section>
      ) : null}

      {state.error ? <p aria-live="polite" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{state.error}</p> : null}

      <div className="flex flex-wrap gap-3 border-t pt-5">
        <button className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-wait disabled:opacity-70" disabled={pending || deceasedPending || plotPending} type="submit">{pending ? "Saving…" : state.occupancyWarning ? "Confirm and save interment" : submitLabel}</button>
        <Link className="inline-flex min-h-12 items-center justify-center rounded-lg border bg-white px-5 py-3 font-semibold hover:bg-accent" href={cancelHref}>Cancel</Link>
      </div>
    </form>
  );
}
