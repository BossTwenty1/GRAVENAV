# Administrator deceased-record management

Task 5A adds a protected Administrator workflow for deceased-person records. It does not add interment or plot management, public search, mapping, GPS, reports, imports, or deployment behavior.

## Routes and capabilities

- `/admin/deceased` lists 25 records per page and searches generated normalized names with a bounded database query.
- `/admin/deceased/new` creates a deceased-person record.
- `/admin/deceased/[id]` displays the managed record details.
- `/admin/deceased/[id]/edit` corrects the same record without replacing its identity.

All routes are under the existing protected Administrator layout. Reads and writes use the authenticated server-side Supabase client and remain subject to the existing active-Administrator RLS policies. No service-role key or client-supplied role is used.

## Managed fields and validation

The form manages the existing `source_display_name`, `date_of_birth`, and `date_of_death` columns. A name is required; repeated whitespace is collapsed and Unicode text and punctuation are otherwise preserved. The application does not infer or populate given, middle, family, or suffix fields. The database continues to generate `display_name` and `normalized_search_name` consistently with Task 4.

Birth and death dates are optional ISO date-only values. Invalid calendar dates and a birth date later than the death date are rejected without fabricating missing values.

## Duplicate awareness

Before create or correction, the server checks up to ten exact normalized-name matches. Candidates with conflicting known dates are excluded. A shared known date is labeled as a stronger probable match; a name-only match is explicitly described as insufficient proof of identity. The Administrator can review candidates in a separate tab, cancel, or deliberately save the record as a different person. Records are never merged automatically.

## Audit and deletion behavior

`create_deceased_person` and `update_deceased_person` are security-invoker functions. Each rechecks active Administrator authorization, performs the mutation through existing RLS, and appends a concise audit event in the same database transaction. Audit rows contain the actor reference, action, entity type, entity ID, timestamp, and changed field names; raw before/after payloads are not stored. Unchanged saves do not create misleading audit events.

No hard-delete button, Server Action, route, database function, grant, or RLS policy is added. The existing no-hard-delete rule for deceased records remains in force.
