-- GRAVENAV Task 2: normalized Supabase/PostGIS database foundation.
-- This migration contains schema only. It does not create users, buckets, or
-- production/client records. Public client access remains deny-by-default.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists postgis with schema extensions;

create type public.record_state as enum ('active', 'archived');
create type public.coordinate_status as enum (
  'recorded',
  'pending_verification',
  'verified',
  'rejected'
);
create type public.verification_result as enum ('pending', 'verified', 'rejected');
create type public.import_batch_status as enum ('pending', 'running', 'completed', 'failed', 'cancelled');
create type public.import_issue_severity as enum ('info', 'warning', 'error');
create type public.import_issue_status as enum ('open', 'resolved', 'ignored');

create or replace function public.person_display_name(
  p_given_name text,
  p_middle_name text,
  p_family_name text,
  p_suffix text
)
returns text
language sql
immutable
as $$
  select btrim(
    coalesce(nullif(btrim(p_given_name), ''), '')
    || case when nullif(btrim(p_middle_name), '') is not null then ' ' || btrim(p_middle_name) else '' end
    || case when nullif(btrim(p_family_name), '') is not null then ' ' || btrim(p_family_name) else '' end
    || case when nullif(btrim(p_suffix), '') is not null then ' ' || btrim(p_suffix) else '' end
  );
$$;

create or replace function public.normalize_person_name(
  p_given_name text,
  p_middle_name text,
  p_family_name text,
  p_suffix text
)
returns text
language sql
immutable
as $$
  select lower(public.person_display_name(p_given_name, p_middle_name, p_family_name, p_suffix));
$$;

create or replace function public.set_point_from_lat_lng()
returns trigger
language plpgsql
as $$
begin
  if new.latitude is null
    or new.longitude is null
    or new.latitude not between -90 and 90
    or new.longitude not between -180 and 180 then
    new.position := null;
  else
    new.position := extensions.st_setsrid(
      extensions.st_makepoint(new.longitude, new.latitude),
      4326
    )::extensions.geography;
  end if;
  return new;
end;
$$;

create table public.import_batches (
  id uuid primary key default extensions.gen_random_uuid(),
  source_label text not null,
  source_file_reference text,
  source_sheet text,
  import_type text not null,
  status public.import_batch_status not null default 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  records_seen integer check (records_seen is null or records_seen >= 0),
  records_imported integer check (records_imported is null or records_imported >= 0),
  records_rejected integer check (records_rejected is null or records_rejected >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cemetery_sites (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  code text,
  description text,
  is_active boolean not null default true,
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cemetery_areas (
  id uuid primary key default extensions.gen_random_uuid(),
  cemetery_site_id uuid not null references public.cemetery_sites(id),
  source_code text,
  source_label text,
  code text,
  name text not null,
  geometry extensions.geometry(Geometry, 4326),
  is_active boolean not null default true,
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sectors (
  id uuid primary key default extensions.gen_random_uuid(),
  cemetery_area_id uuid not null references public.cemetery_areas(id),
  source_identifier text,
  identifier text not null,
  name text,
  geometry extensions.geometry(Geometry, 4326),
  is_active boolean not null default true,
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plot_types (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  regular_interment_capacity integer
    check (regular_interment_capacity is null or regular_interment_capacity >= 0),
  is_active boolean not null default true,
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.navigation_nodes (
  id uuid primary key default extensions.gen_random_uuid(),
  cemetery_site_id uuid not null references public.cemetery_sites(id),
  point extensions.geometry(Point, 4326),
  node_type text,
  is_accessible boolean,
  is_active boolean not null default true,
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, cemetery_site_id)
);

create table public.plots (
  id uuid primary key default extensions.gen_random_uuid(),
  cemetery_site_id uuid not null references public.cemetery_sites(id),
  cemetery_area_id uuid references public.cemetery_areas(id),
  sector_id uuid references public.sectors(id),
  normalized_plot_identifier text not null,
  raw_lot_location text,
  normalized_lot_key text not null,
  plot_type_id uuid references public.plot_types(id),
  unresolved_source_classification text,
  source_commercial_status text check (
    source_commercial_status is null
    or source_commercial_status in ('BOOKED', 'AVAILABLE', 'HOLD')
  ),
  geometry extensions.geometry(Geometry, 4326),
  navigation_access_node_id uuid,
  state public.record_state not null default 'active',
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (navigation_access_node_id, cemetery_site_id)
    references public.navigation_nodes(id, cemetery_site_id)
);

create table public.navigation_edges (
  id uuid primary key default extensions.gen_random_uuid(),
  from_node_id uuid not null references public.navigation_nodes(id),
  to_node_id uuid not null references public.navigation_nodes(id),
  path extensions.geometry(LineString, 4326),
  distance_meters double precision check (distance_meters is null or distance_meters >= 0),
  is_bidirectional boolean not null default true,
  is_accessible boolean,
  is_active boolean not null default true,
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_node_id <> to_node_id)
);

create table public.deceased_persons (
  id uuid primary key default extensions.gen_random_uuid(),
  given_name text,
  middle_name text,
  family_name text,
  suffix text,
  display_name text generated always as (
    public.person_display_name(given_name, middle_name, family_name, suffix)
  ) stored,
  normalized_search_name text generated always as (
    public.normalize_person_name(given_name, middle_name, family_name, suffix)
  ) stored,
  date_of_birth date,
  date_of_death date,
  state public.record_state not null default 'active',
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (display_name <> '')
);

create table public.interments (
  id uuid primary key default extensions.gen_random_uuid(),
  deceased_person_id uuid not null references public.deceased_persons(id),
  plot_id uuid not null references public.plots(id),
  interment_date date,
  interment_type text,
  position_sequence integer check (position_sequence is null or position_sequence > 0),
  permanence_status text,
  state public.record_state not null default 'active',
  is_publicly_visible boolean not null default false,
  import_batch_id uuid references public.import_batches(id),
  source_reference text,
  notes text,
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gravesite_photos (
  id uuid primary key default extensions.gen_random_uuid(),
  plot_id uuid references public.plots(id),
  interment_id uuid references public.interments(id),
  storage_bucket text not null default 'gravesite-photos',
  storage_object_path text not null,
  caption text,
  description text,
  is_publicly_visible boolean not null default false,
  state public.record_state not null default 'active',
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (plot_id is not null or interment_id is not null)
);

create table public.coordinate_collection_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  session_identifier text not null unique,
  collector_reference text,
  device_label text,
  method text,
  started_at timestamptz,
  ended_at timestamptz,
  notes text,
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.map_control_points (
  id uuid primary key default extensions.gen_random_uuid(),
  cemetery_site_id uuid not null references public.cemetery_sites(id),
  control_point_label text not null,
  physical_feature_description text,
  source_plan_reference text,
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  position extensions.geography(Point, 4326),
  coordinate_status public.coordinate_status not null default 'recorded',
  notes text,
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null) = (longitude is null))
);

create table public.coordinate_observations (
  id uuid primary key default extensions.gen_random_uuid(),
  plot_id uuid references public.plots(id),
  map_control_point_id uuid references public.map_control_points(id),
  collection_session_id uuid references public.coordinate_collection_sessions(id),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  horizontal_accuracy_meters double precision
    check (horizontal_accuracy_meters is null or horizontal_accuracy_meters >= 0),
  captured_at timestamptz not null,
  capture_method text not null,
  collector_reference text,
  device_label text,
  notes text,
  position extensions.geography(Point, 4326),
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((plot_id is not null) <> (map_control_point_id is not null))
);

create table public.gravesite_coordinates (
  id uuid primary key default extensions.gen_random_uuid(),
  plot_id uuid not null references public.plots(id),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  position extensions.geography(Point, 4326),
  status public.coordinate_status not null default 'recorded',
  source_observation_id uuid references public.coordinate_observations(id),
  supersedes_coordinate_id uuid references public.gravesite_coordinates(id),
  is_current boolean not null default true,
  recorded_at timestamptz not null default now(),
  superseded_at timestamptz,
  notes text,
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_current and superseded_at is null) or not is_current)
);

create table public.coordinate_verifications (
  id uuid primary key default extensions.gen_random_uuid(),
  gravesite_coordinate_id uuid not null references public.gravesite_coordinates(id),
  result public.verification_result not null,
  reviewer_reference text,
  verified_at timestamptz,
  notes text,
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((result = 'pending' and verified_at is null) or result <> 'pending')
);

create table public.map_features (
  id uuid primary key default extensions.gen_random_uuid(),
  cemetery_site_id uuid not null references public.cemetery_sites(id),
  feature_type text not null,
  label text,
  geometry extensions.geometry(Geometry, 4326),
  provenance_source_type text,
  source_reference text,
  status public.coordinate_status not null default 'recorded',
  is_active boolean not null default true,
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.import_issues (
  id uuid primary key default extensions.gen_random_uuid(),
  import_batch_id uuid not null references public.import_batches(id),
  source_row_reference text,
  issue_code text not null,
  severity public.import_issue_severity not null,
  field_name text,
  raw_value text,
  description text not null,
  resolution_status public.import_issue_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_reference text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  changed_fields jsonb,
  before_data jsonb,
  after_data jsonb,
  occurred_at timestamptz not null default now()
);

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  application_role text not null default 'administrator'
    check (application_role = 'administrator'),
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger map_control_points_set_position
before insert or update of latitude, longitude on public.map_control_points
for each row execute function public.set_point_from_lat_lng();

create trigger coordinate_observations_set_position
before insert or update of latitude, longitude on public.coordinate_observations
for each row execute function public.set_point_from_lat_lng();

create trigger gravesite_coordinates_set_position
before insert or update of latitude, longitude on public.gravesite_coordinates
for each row execute function public.set_point_from_lat_lng();

create unique index cemetery_sites_code_unique
  on public.cemetery_sites (lower(code)) where code is not null;
create unique index cemetery_areas_code_unique
  on public.cemetery_areas (cemetery_site_id, lower(code)) where code is not null;
create unique index sectors_identifier_unique
  on public.sectors (cemetery_area_id, lower(identifier));
create unique index plot_types_code_unique
  on public.plot_types (lower(code));
create unique index plots_normalized_key_unique
  on public.plots (cemetery_site_id, normalized_lot_key);
create index plots_area_idx on public.plots (cemetery_area_id);
create index plots_sector_idx on public.plots (sector_id);
create index plots_commercial_status_idx on public.plots (source_commercial_status);
create index deceased_persons_normalized_name_idx
  on public.deceased_persons (normalized_search_name);
create index interments_deceased_person_idx on public.interments (deceased_person_id);
create index interments_plot_idx on public.interments (plot_id);
create index interments_public_idx
  on public.interments (is_publicly_visible) where state = 'active';
create index gravesite_photos_plot_idx on public.gravesite_photos (plot_id);
create index gravesite_photos_interment_idx on public.gravesite_photos (interment_id);
create index coordinate_observations_plot_idx on public.coordinate_observations (plot_id);
create index coordinate_observations_session_idx
  on public.coordinate_observations (collection_session_id);
create index coordinate_observations_accuracy_idx
  on public.coordinate_observations (horizontal_accuracy_meters);
create index gravesite_coordinates_plot_status_idx
  on public.gravesite_coordinates (plot_id, status);
create unique index gravesite_coordinates_one_current_idx
  on public.gravesite_coordinates (plot_id)
  where is_current and superseded_at is null;
create index coordinate_verifications_coordinate_idx
  on public.coordinate_verifications (gravesite_coordinate_id, result);
create index import_batches_status_idx on public.import_batches (status);
create index import_issues_batch_status_idx
  on public.import_issues (import_batch_id, resolution_status);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_occurred_at_idx on public.audit_logs (occurred_at desc);

create index cemetery_areas_geometry_gist_idx
  on public.cemetery_areas using gist (geometry);
create index sectors_geometry_gist_idx
  on public.sectors using gist (geometry);
create index plots_geometry_gist_idx
  on public.plots using gist (geometry);
create index navigation_nodes_point_gist_idx
  on public.navigation_nodes using gist (point);
create index navigation_edges_path_gist_idx
  on public.navigation_edges using gist (path);
create index map_control_points_position_gist_idx
  on public.map_control_points using gist (position);
create index coordinate_observations_position_gist_idx
  on public.coordinate_observations using gist (position);
create index gravesite_coordinates_position_gist_idx
  on public.gravesite_coordinates using gist (position);
create index map_features_geometry_gist_idx
  on public.map_features using gist (geometry);

create or replace view public.plot_occupancy
with (security_invoker = true)
as
select
  p.id as plot_id,
  p.cemetery_site_id,
  p.normalized_plot_identifier,
  p.source_commercial_status,
  count(i.id)::integer as active_interment_count,
  case count(i.id)
    when 0 then 'unoccupied'
    when 1 then 'occupied'
    else 'multiple_interments'
  end as derived_occupancy_status
from public.plots p
left join public.interments i
  on i.plot_id = p.id
 and i.state = 'active'
group by p.id, p.cemetery_site_id, p.normalized_plot_identifier, p.source_commercial_status;

comment on view public.plot_occupancy is
  'Derived from active interments; source commercial status is intentionally kept separate.';
comment on table public.gravesite_coordinates is
  'Versioned candidate/current plot destinations. Replacing a verified coordinate requires a new row and verification.';
comment on table public.coordinate_observations is
  'Raw field observations preserved independently from accepted gravesite coordinates.';

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'import_batches',
    'cemetery_sites',
    'cemetery_areas',
    'sectors',
    'plot_types',
    'navigation_nodes',
    'plots',
    'navigation_edges',
    'deceased_persons',
    'interments',
    'gravesite_photos',
    'coordinate_collection_sessions',
    'map_control_points',
    'coordinate_observations',
    'gravesite_coordinates',
    'coordinate_verifications',
    'map_features',
    'import_issues',
    'audit_logs',
    'user_profiles'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;

revoke all on table public.plot_occupancy from anon, authenticated;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke create on schema public from anon, authenticated;

-- No policies are created in Task 2. This intentionally leaves anon and
-- authenticated without table access until the authentication task adds
-- narrowly scoped administrator/public policies.
