# GRAVENAV database foundation

Task 2 adds the initial normalized Supabase/PostgreSQL/PostGIS schema. The migration is intentionally a foundation: it does not implement authentication UI, public search, CRUD workflows, importing, map rendering, GPS capture, or routing.

## Migration and local workflow

The database definition is in:

- `supabase/config.toml`
- `supabase/migrations/20260910220000_initial_database_foundation.sql`
- `supabase/seed.sql`

With the Supabase CLI and Docker installed, run from the repository root:

```bash
supabase start
supabase db reset
supabase db lint
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

Task 2 creates no RLS policies and revokes table/sequence access from `anon` and `authenticated`. This prevents accidental public or generic-authenticated access to sensitive base tables. Administrator authorization and a carefully whitelisted public read layer are deferred to the authentication/public-access tasks. No service-role key is used in browser code.

`audit_logs` is an internal correction-history foundation. `user_profiles` is a lightweight future reference to `auth.users` with only the planned `administrator` role; no users or credentials are created.

## Imports and synthetic data

`import_batches` and `import_issues` preserve source references and validation issues without storing confidential file contents. Raw issue values are intentionally a single optional text field and should contain only safe values.

`supabase/seed.sql` creates one explicitly synthetic site, four synthetic plots, three interments across two plots, an unresolved `MCF` source classification, and synthetic coordinate examples. It contains no client names, addresses, phone numbers, financial information, real burial records, or production coordinates.

## Deferred work

- administrator authentication, profiles, and policies;
- whitelisted public directory/search access;
- real client-data import and validation;
- map/QGIS processing and geometry ingestion;
- coordinate capture and verification UI;
- photo storage bucket policy and upload UI;
- cemetery map rendering and GPS navigation;
- routing algorithms and navigation instructions;
- CRUD/query implementation using the generated `src/types/database.types.ts` types.

The generated database types now live at `src/types/database.types.ts` and were produced from the local database with `npx supabase gen types typescript --local`. They must be regenerated after reviewed schema changes rather than hand-edited.
