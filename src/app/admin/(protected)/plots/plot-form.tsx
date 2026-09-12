"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";

import { useFocusFirstError } from "@/hooks/use-focus-first-error";
import type { PlotOption, PlotTypeOption } from "@/lib/plots/data";
import type { PlotFormValues } from "@/lib/plots/validation";

import {
  searchAreas,
  searchPlotTypes,
  searchSectors,
  searchSites,
  type PlotFormState,
} from "./actions";

type PlotAction = (state: PlotFormState, formData: FormData) => Promise<PlotFormState>;
type PickerResponse = { options: PlotOption[]; error?: string };

function Picker({
  id,
  title,
  description,
  selected,
  onSelect,
  onClear,
  search,
  disabled = false,
  pending: formPending,
}: {
  id: string;
  title: string;
  description: string;
  selected: PlotOption | null;
  onSelect: (option: PlotOption) => void;
  onClear: () => void;
  search: (query: string) => Promise<PickerResponse>;
  disabled?: boolean;
  pending: boolean;
}) {
  const [results, setResults] = useState<PlotOption[]>([]);
  const [error, setError] = useState<string>();
  const [pending, startSearch] = useTransition();
  return (
    <section aria-labelledby={`${id}-heading`} className="admin-form-section">
      <h2 className="font-semibold" id={`${id}-heading`}>{title} <span className="text-red-700">(required)</span></h2>
      <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      {selected ? (
        <div className="admin-selected-record mt-3">
          <p className="font-semibold text-green-950">Selected: {selected.label}</p>
          {selected.context ? <p className="mt-1 text-sm text-green-900">{selected.context}</p> : null}
          <button className="admin-text-link mt-2" disabled={formPending} onClick={onClear} type="button">Change selection</button>
        </div>
      ) : (
        <div className="mt-3 grid gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor={`${id}-search`}>Search {title.toLocaleLowerCase("en-US")}</label>
            <input autoComplete="off" className="admin-control min-w-0 flex-1" disabled={disabled || formPending} id={`${id}-search`} maxLength={100} placeholder={disabled ? "Complete the preceding selection first…" : `Search ${title.toLocaleLowerCase("en-US")}…`} type="search" />
            <button className="admin-button-secondary" disabled={disabled || pending || formPending} onClick={() => {
              const input = document.getElementById(`${id}-search`) as HTMLInputElement;
              startSearch(async () => {
                const response = await search(input.value);
                setResults(response.options);
                setError(response.error);
              });
            }} type="button">{pending ? "Searching…" : "Search"}</button>
          </div>
          {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
          {results.length ? <ul aria-live="polite" className="grid gap-2">{results.map((option) => (
            <li className="flex flex-col justify-between gap-2 rounded-lg border bg-white p-3 sm:flex-row sm:items-center" key={option.id}>
              <span><strong>{option.label}</strong>{option.context ? <span className="mt-1 block text-sm text-muted">{option.context}</span> : null}</span>
              <button className="admin-button-secondary" onClick={() => onSelect(option)} type="button">Select</button>
            </li>
          ))}</ul> : null}
        </div>
      )}
    </section>
  );
}

export function PlotForm({
  action,
  initialValues,
  initialSite,
  initialArea,
  initialSector,
  initialPlotType,
  submitLabel,
  cancelHref = "/admin/plots",
  allowLifecycle = false,
}: {
  action: PlotAction;
  initialValues: PlotFormValues;
  initialSite?: PlotOption;
  initialArea?: PlotOption;
  initialSector?: PlotOption;
  initialPlotType?: PlotTypeOption;
  submitLabel: string;
  cancelHref?: string;
  allowLifecycle?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? initialValues;
  const [site, setSite] = useState<PlotOption | null>(initialSite ?? null);
  const [area, setArea] = useState<PlotOption | null>(initialArea ?? null);
  const [sector, setSector] = useState<PlotOption | null>(initialSector ?? null);
  const [plotType, setPlotType] = useState<PlotTypeOption | null>(initialPlotType ?? null);
  const formRef = useFocusFirstError(state.fieldErrors);

  return (
    <form action={formAction} className="grid gap-7" noValidate ref={formRef}>
      <input name="siteId" type="hidden" value={site?.id ?? ""} />
      <input name="areaId" type="hidden" value={area?.id ?? ""} />
      <input name="sectorId" type="hidden" value={sector?.id ?? ""} />
      <input name="plotTypeId" type="hidden" value={plotType?.id ?? ""} />

      <Picker description="Select an existing active cemetery site. No hierarchy record is created by this form." id="site" onClear={() => { setSite(null); setArea(null); setSector(null); }} onSelect={(option) => { setSite(option); setArea(null); setSector(null); }} pending={pending} search={searchSites} selected={site} title="Cemetery site" />
      {state.fieldErrors?.siteId ? <p className="-mt-5 text-sm text-red-700" role="alert">{state.fieldErrors.siteId}</p> : null}

      <Picker description="Results are limited to active areas or gardens belonging to the selected site." disabled={!site} id="area" key={site?.id ?? "no-site"} onClear={() => { setArea(null); setSector(null); }} onSelect={(option) => { setArea(option); setSector(null); }} pending={pending} search={(query) => searchAreas(site?.id ?? "", query)} selected={area} title="Area or garden" />
      {state.fieldErrors?.areaId ? <p className="-mt-5 text-sm text-red-700" role="alert">{state.fieldErrors.areaId}</p> : null}

      <Picker description="Results are limited to active sectors belonging to the selected area or garden." disabled={!area} id="sector" key={area?.id ?? "no-area"} onClear={() => setSector(null)} onSelect={setSector} pending={pending} search={(query) => searchSectors(area?.id ?? "", query)} selected={sector} title="Sector" />
      {state.fieldErrors?.sectorId ? <p className="-mt-5 text-sm text-red-700" role="alert">{state.fieldErrors.sectorId}</p> : null}

      <div>
        <label className="block text-sm font-semibold" htmlFor="plotIdentifier">Plot identifier <span className="text-red-700">(required)</span></label>
        <p className="mt-1 text-sm leading-6 text-muted">Enter only the verified human-readable identifier. GRAVENAV normalizes whitespace and case for deterministic duplicate checking.</p>
        <input aria-describedby={state.fieldErrors?.plotIdentifier ? "plotIdentifier-error" : undefined} aria-invalid={Boolean(state.fieldErrors?.plotIdentifier)} autoComplete="off" className="admin-control mt-2" defaultValue={values.plotIdentifier} disabled={pending} id="plotIdentifier" maxLength={100} name="plotIdentifier" required />
        {state.fieldErrors?.plotIdentifier ? <p className="mt-2 text-sm text-red-700" id="plotIdentifier-error">{state.fieldErrors.plotIdentifier}</p> : null}
      </div>

      <Picker description="Select an existing active plot type. Capacity is inherited and cannot be edited here." id="plot-type" onClear={() => setPlotType(null)} onSelect={(option) => setPlotType(option as PlotTypeOption)} pending={pending} search={searchPlotTypes} selected={plotType} title="Plot type" />
      {plotType ? <p className="admin-alert-neutral -mt-5">Inherited regular interment capacity: {plotType.capacity ?? "unknown / not configured"}</p> : null}
      {state.fieldErrors?.plotTypeId ? <p className="-mt-5 text-sm text-red-700" role="alert">{state.fieldErrors.plotTypeId}</p> : null}

      {allowLifecycle ? <div>
        <label className="block text-sm font-semibold" htmlFor="state">Lifecycle state</label>
        <select className="admin-control mt-2 sm:max-w-sm" defaultValue={values.state} disabled={pending} id="state" name="state"><option value="active">Active</option><option value="archived">Archived</option></select>
        <p className="mt-1 text-sm text-muted">Plots with active interments cannot be archived. Archiving preserves the plot UUID and history.</p>
      </div> : <input name="state" type="hidden" value="active" />}

      {state.duplicate ? <p className="admin-alert-error" role="alert">A plot named {state.duplicate.identifier} already represents this normalized location. Records are never merged automatically. <Link className="font-semibold underline" href={`/admin/plots/${state.duplicate.id}`} rel="noopener noreferrer" target="_blank">Open existing plot</Link></p> : null}

      {state.locationWarning ? <section className="admin-alert-warning" role="alert">
        <h2 className="font-semibold text-amber-950">Confirm correction to an occupied plot location</h2>
        <p className="mt-2 text-sm leading-6 text-amber-900">{state.locationWarning.identifier} has {state.locationWarning.activeIntermentCount} active {state.locationWarning.activeIntermentCount === 1 ? "interment" : "interments"}. The plot UUID and its interments will remain attached, but the hierarchy or normalized location will change.</p>
        <input name="locationConfirmation" type="hidden" value={state.confirmationKey} />
      </section> : null}

      {state.error ? <p aria-live="polite" className="admin-alert-error" role="alert">{state.error}</p> : null}

      <div className="flex flex-wrap gap-3 border-t pt-5">
        <button className="admin-button-primary" disabled={pending} type="submit">{pending ? "Saving…" : state.locationWarning ? "Confirm and save correction" : submitLabel}</button>
        <Link className="admin-button-secondary" href={cancelHref}>Cancel</Link>
      </div>
    </form>
  );
}
