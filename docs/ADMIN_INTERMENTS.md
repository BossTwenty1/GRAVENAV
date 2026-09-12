# Administrator interment management

Task 5B adds a protected Administrator workflow for managing the existing relationship between a deceased-person record and a plot. It does not add plot CRUD, public search, mapping, GPS, reports, photos, imports, or deployment behavior.

## Routes and bounded lookup

- `/admin/interments` lists 25 records per page, searches by normalized deceased name in the database, and optionally filters by the existing `active` or `archived` lifecycle state.
- `/admin/interments/new` creates an interment from explicitly selected existing records.
- `/admin/interments/[id]` displays safe interment, deceased, plot, hierarchy, capacity, occupancy, and timestamp information.
- `/admin/interments/[id]/edit` corrects the same interment UUID and can use the existing lifecycle state.

The deceased and plot pickers query at most 12 matches at a time. Deceased lookup uses the generated normalized name. Plot lookup uses the normalized lot key and displays the normalized identifier plus site, area, and sector context. Neither picker loads the full table into the browser, matches names as identity, or creates related records as a side effect.

All routes use the existing protected Administrator layout. Data-access functions and Server Actions also recheck active Administrator authorization close to each operation. The authenticated server client remains subject to RLS; no service-role key is used by the application.

## Managed fields and validation

The form uses only existing `interments` columns: `deceased_person_id`, `plot_id`, `interment_date`, `interment_type`, `position_sequence`, `permanence_status`, and, during correction, `state`. The free-text optional fields are administrative metadata with no invented cemetery vocabulary: Administrators should enter only verified existing descriptions. They never determine capacity or occupancy and can be migrated later if approved controlled values are defined. Import provenance, source references, notes, synthetic flags, and public visibility are not exposed or changed by this workflow.

Interment dates use strict ISO date-only validation. When a death date is present, the interment cannot precede it; an absent death date is left absent. Position sequence, when supplied, must be a positive whole number.

An exact deceased UUID, plot UUID, and interment-date combination is rejected across active and archived history. Names alone never determine identity, and duplicate records cannot be deliberately bypassed.

## Multiple interments, capacity, and occupancy

Multiple interments per plot remain supported. A second active interment is not automatically rejected when capacity allows it, but the Administrator must review safe context and deliberately confirm. The database rechecks the confirmation inside the mutation transaction after locking the target plot.

Configured capacity comes from `plot_types.regular_interment_capacity`. An active placement at or above that capacity is rejected. When capacity is not configured, the application does not invent one: a first active interment may enter an empty plot, but creation or movement of another active interment into that plot is blocked until capacity is configured or reviewed. Administrator confirmation cannot bypass unknown capacity.

The existing security-invoker `plot_occupancy` view remains the source of occupancy status:

- zero active interments: `unoccupied`;
- one active interment: `occupied`;
- two or more active interments: `multiple_interments`.

Archiving removes an interment from the active count without deleting history. A move or reactivation rechecks the destination plot; moving recalculates both source and destination through the derived view. `source_commercial_status` remains independent and is never treated as physical occupancy.

## Atomic audit and no hard delete

`create_interment` and `update_interment` are security-invoker RPCs. Each independently checks active Administrator authorization, validates relationships/date/duplicates/capacity, performs the mutation through RLS, and appends its audit event in the same PostgreSQL transaction. Audit rows contain actor, action, entity type, entity ID, timestamp, and changed field names only. `before_data` and `after_data` are unused.

Task 5B adds no delete button, DELETE Server Action, DELETE RPC, DELETE API route, table grant, or RLS policy. Historical interments are corrected or archived, never routinely hard-deleted.
