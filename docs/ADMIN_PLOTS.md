# Administrator plot management

Task 5C adds protected Administrator list, search, detail, creation, and correction workflows for the existing `plots` model. It does not add plot-type or cemetery-hierarchy CRUD, public search, mapping, coordinate/GPS work, routing, photos, reports, imports, or deployment behavior.

## Routes and bounded queries

- `/admin/plots` lists 25 plots per page and searches the database by normalized lot key. Optional bounded filters cover cemetery site, plot type, and the existing active/archived lifecycle.
- `/admin/plots/new` creates one plot from explicitly selected existing records.
- `/admin/plots/[id]` shows hierarchy, inherited capacity, derived occupancy, commercial-source metadata, timestamps, and up to 25 linked active interments.
- `/admin/plots/[id]/edit` corrects the same plot UUID.

Filter option queries return at most 50 active configuration records. Form searches return at most 12 matches. Site selection constrains areas/gardens, and area selection constrains sectors. Plot-type lookup is bounded and never edits the shared type.

All reads and picker searches recheck active Administrator authorization in server data-access functions. Every Server Action repeats the check, and the authenticated Supabase client remains subject to RLS.

## Location identity and duplicates

The form requires an existing active site, area/garden, sector, and plot type. It never creates hierarchy or plot-type records as a side effect. The hierarchy is revalidated inside the database mutation.

Administrators enter a verified human-readable plot identifier. Whitespace is normalized deterministically for display, and a lowercase normalized lot key is generated for identity/search. The existing unique site-plus-normalized-key design rejects exact physical duplicates. Similar records are not fuzzily matched or merged. Manual creation leaves `raw_lot_location`, unresolved classification, geometry, navigation, and source-commercial fields untouched rather than inventing provenance.

## Plot type and capacity safety

Capacity remains inherited from `plot_types.regular_interment_capacity`; it is displayed as a configured number or unknown/not configured and is never copied into or edited on a plot form.

When changing a plot type, a configured capacity below the current active-interment count is rejected. A type with unknown capacity cannot replace the type of a plot with multiple active interments because compatibility cannot be confirmed. No interments are altered automatically.

## Occupancy and commercial metadata

Occupancy is read-only and continues to come from the security-invoker `plot_occupancy` view:

- zero active interments: `unoccupied`;
- one active interment: `occupied`;
- two or more active interments: `multiple_interments`.

Archived interments do not contribute to active occupancy. `BOOKED`, `AVAILABLE`, and `HOLD` remain source/commercial metadata and never set or infer physical occupancy or capacity.

## Correction, lifecycle, audit, and deletion

Corrections retain the plot UUID and all attached interments. A hierarchy or normalized-location change on a plot with active interments requires deliberate confirmation tied to the proposed destination and observed active count. Duplicate destinations remain blocked. A plot with active interments cannot be archived; an empty plot may use the existing archived state without deleting history.

The security-invoker `create_plot` and `update_plot` RPCs independently verify active Administrator authorization, validate hierarchy, duplicate, capacity, lifecycle, and confirmation rules, then write the plot and audit event atomically under RLS. Audit events use `plot.created` and `plot.updated` with actor, action, entity type, entity ID, timestamp, and changed field names only. `before_data` and `after_data` remain unused.

Task 5C adds no Delete button, DELETE Server Action, DELETE RPC, DELETE API route, authenticated DELETE grant, or plot DELETE RLS policy.
