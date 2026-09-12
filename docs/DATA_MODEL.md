# GRAVENAV database foundation

Task 2 adds the initial normalized Supabase/PostgreSQL/PostGIS schema. Task 3 adds authentication authorization support and RLS/grants. Task 4 adds the safe import foundation. Tasks 5A–5C add narrowly scoped Administrator deceased-record, interment, and plot management without implementing plot-type/hierarchy CRUD, public search, mapping, GPS, reports, photos, or routing.

## Migration and local workflow

The database definition is in:

- `supabase/config.toml`
- `supabase/migrations/20260910220000_initial_database_foundation.sql`
- `supabase/migrations/20260911100000_administrator_authorization.sql`
- `supabase/migrations/20260911140000_safe_import_pipeline.sql`
- `supabase/migrations/20260911180000_admin_deceased_management.sql`
- `supabase/migrations/20260912100000_admin_interment_management.sql`
- `supabase/migrations/20260912140000_admin_plot_management.sql`
- `supabase/seed.sql`
- `supabase/tests/administrator_authorization.test.sql`
- `supabase/tests/admin_deceased_management.test.sql`
- `supabase/tests/admin_interment_management.test.sql`
- `supabase/tests/admin_plot_management.test.sql`

With the Supabase CLI and Docker installed, run from the repository root:

```bash
supabase start
supabase db reset
supabase db lint
supabase test db
```

`supabase db reset` recreates the local database from the tracked migrations and then runs the development seed. The seed is synthetic only and must never be treated as Forest Lake data. No remote project is linked or modified by this task.

## Main relationships

```text
cemetery_sites
  ├── cemetery_areas ── sectors
  ├── plots ──< interments >── deceased_persons
  │     ├── gravesite_coordinates ──< coordinate_verifications
  │     ├── coordinate_observations >── coordinate_collection_sessions
  │     └── gravesite_photos
  ├── navigation_nodes ──< navigation_edges
  ├── map_control_points ──< coordinate_observations
  └── map_features
```

`plots` and `interments` are deliberately separate. A plot may have zero, one, or many active interments, and one deceased person is connected to a plot through an interment record. No unique constraint prevents multiple interments on a plot.

`plot_types` is configurable. The development seed maps `STD`, `PRM`, and `SPR`; it does not confirm `EST` or `MCF`. A lawn-style capacity of two is a prototype decision only, not a cemetery-wide policy.

## Commercial status and occupancy

`plots.source_commercial_status` stores source inventory metadata (`BOOKED`, `AVAILABLE`, or `HOLD`). It is never used as physical occupancy.

The `plot_occupancy` view derives occupancy from active `interments`:

- zero active interments: `unoccupied`
- one active interment: `occupied`
- more than one active interment: `multiple_interments`

The view uses `security_invoker` and has no client grants in this task. Its output therefore does not bypass the deny-by-default security posture.

## Coordinates and spatial data

PostGIS is enabled in the `extensions` schema. WGS84/SRID 4326 is used for nullable cemetery/area/sector/plot geometry, navigation points and paths, map features, and geography points.

`coordinate_observations` preserves raw readings, including capture session, method, accuracy, device, collector reference, and timestamp. Observations target either a plot or a map control point, never both. `gravesite_coordinates` stores an accepted/candidate plot destination separately and keeps supersession history. A partial unique index allows only one current, non-superseded coordinate per plot.

Coordinate lifecycle values are `recorded`, `pending_verification`, `verified`, and `rejected`. A missing plot coordinate is represented by no row. Replacing a verified location should create a new coordinate version and a new verification history record.

The project-defined UI accuracy bands are <=5 m good, >5–10 m fair, and >10 m poor. They remain application/evaluation thresholds; the database stores raw accuracy and makes no precision guarantee.

Navigation nodes and edges, map control points, and map features are schema foundations only. No real cemetery geometry, paths, control points, or routing algorithm are included.

## Privacy and security posture

The following application tables have Row Level Security enabled:

`import_batches`, `cemetery_sites`, `cemetery_areas`, `sectors`, `plot_types`, `navigation_nodes`, `plots`, `navigation_edges`, `deceased_persons`, `interments`, `gravesite_photos`, `coordinate_collection_sessions`, `map_control_points`, `coordinate_observations`, `gravesite_coordinates`, `coordinate_verifications`, `map_features`, `import_issues`, `audit_logs`, and `user_profiles`.

Task 2 creates no RLS policies and revokes table/sequence access from `anon` and `authenticated`. Task 3 preserves complete `anon` denial and grants `authenticated` only operations guarded by explicit administrator policies. The `plot_occupancy` view remains `security_invoker`, so its underlying table policies still apply. A carefully whitelisted public read layer remains deferred.

Authentication and application authorization are separate. Supabase Auth identifies a user; an active `public.user_profiles` row with the sole MVP role `administrator` authorizes that identity. Profiles are explicit approvals and are not auto-created. Role and active-state defaults do not grant access.

`private.is_administrator()` is a zero-argument, stable `SECURITY DEFINER` function used by RLS. It is outside the Data API's exposed schemas, has an empty search path, schema-qualifies its references, revokes default/Public and anonymous execution, and grants only schema usage plus function execution to `authenticated`. It returns only a boolean for the current `auth.uid()`.

The main application tables have separate SELECT, INSERT, and UPDATE policies for active administrators. Hard DELETE is intentionally narrower: only `navigation_nodes`, `navigation_edges`, and `map_features` retain Administrator DELETE grants and policies because they are rebuildable map/navigation structures that may be regenerated or redesigned. Existing foreign keys continue to prevent unsafe deletion of referenced navigation records.

Core and historical records do not expose hard DELETE through normal Administrator Data API access. Cemetery hierarchy and plot-type records use `is_active`; plots, deceased-person records, interments, and gravesite-photo metadata use their existing state fields; import records use status/resolution fields; and coordinate collection, observation, control-point, gravesite-coordinate, and verification records are corrected, verified, or superseded while preserving provenance. This correction does not add Storage object deletion behavior. `user_profiles` is SELECT-only through administrator RLS; authenticated application users cannot insert, update, or delete authorization rows, preventing self-promotion. `audit_logs` permits authorized administrator SELECT and INSERT only; UPDATE and DELETE grants and policies are absent so historical audit rows remain append-only in normal application flows.

`audit_logs` is an internal correction-history foundation. `user_profiles` references `auth.users` and supports only the approved `administrator` role. Neither migrations nor seed data create Auth users or credentials.

Task 5A uses small security-invoker RPCs to make each deceased-person create/correction and its append-only audit event atomic. Audit metadata contains field names rather than raw before/after record payloads. See [Administrator deceased-record management](ADMIN_DECEASED_RECORDS.md).

Task 5B uses the same atomic pattern for interment create/correction. The functions lock relevant plots before rechecking exact duplicates, active occupancy, configured plot-type capacity, and deliberate occupied-plot confirmation. An empty unknown-capacity plot may receive its first active interment, but further active placements are blocked until capacity is configured or reviewed. They preserve the same interment UUID during correction and use the existing archived state instead of deletion. See [Administrator interment management](ADMIN_INTERMENTS.md).

Task 5C adds atomic plot create/correction RPCs without changing the existing table model. Manual plots require an existing site, area, sector, and plot type; identifier whitespace and the lowercase lot key are normalized deterministically. Type changes cannot reduce capacity below active occupancy or assign unknown capacity to multiple active interments. Occupied location corrections require confirmation, lifecycle transitions cannot archive active occupancy, and the plot UUID and interments remain intact. See [Administrator plot management](ADMIN_PLOTS.md).

## Imports and synthetic data

Task 4 adds `20260911140000_safe_import_pipeline.sql`: optional `deceased_persons.source_display_name` preserves an undecomposed name while generated display/search columns retain existing name-part fallback; `import_batches.validated_records` stores an allowlisted provenance ledger; an import fingerprint index and Administrator-only security-invoker RPC support atomic persistence. Existing RLS and occupancy behavior are unchanged. See [DATA_IMPORT.md](DATA_IMPORT.md) for field allowlists, review states, matching, limits and synthetic validation. No real client migration is included.

`import_batches` and `import_issues` preserve source references and validation issues without storing confidential file contents. Raw issue values are intentionally a single optional text field and should contain only safe values.

`supabase/seed.sql` creates one explicitly synthetic site, four synthetic plots, three interments across two plots, an unresolved `MCF` source classification, and synthetic coordinate examples. It contains no client names, addresses, phone numbers, financial information, real burial records, or production coordinates.

## Deferred work

- administrator account-management UI and any roles beyond the single-role MVP;
- whitelisted public directory/search access;
- real client-data import and validation;
- map/QGIS processing and geometry ingestion;
- coordinate capture and verification UI;
- photo storage bucket policy and upload UI;
- cemetery map rendering and GPS navigation;
- routing algorithms and navigation instructions;
- plot-type and cemetery-hierarchy configuration UI, plus the remaining deferred public, map, coordinate, photo, report, and navigation workflows.

The generated database types live at `src/types/database.types.ts`. Run `npm run db:types` after schema changes; it invokes `npx supabase gen types typescript --local` and only normalizes trailing whitespace so `git diff --check` remains clean. No generated type definition is hand-edited. PostgreSQL routine metadata does not expose argument nullability to the generator, so nullable application RPC parameters are described and narrowly adapted in the handwritten `src/lib/supabase/rpc.ts` boundary.
