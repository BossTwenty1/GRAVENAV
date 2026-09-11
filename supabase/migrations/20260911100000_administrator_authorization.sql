-- GRAVENAV Task 3: administrator authorization, grants, and RLS policies.
-- Authentication alone does not grant application access. An authenticated
-- user must also have an explicitly provisioned, active administrator profile.

alter table public.user_profiles
  alter column application_role drop default,
  alter column is_active set default false;

comment on table public.user_profiles is
  'Explicit GraveNav administrator approvals linked to Supabase Auth users. No row means no application authorization.';
comment on column public.user_profiles.application_role is
  'Privileged application role assigned only through an approved provisioning process.';
comment on column public.user_profiles.is_active is
  'Administrator access is allowed only when this value is true.';

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create or replace function private.is_administrator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = (select auth.uid())
      and application_role = 'administrator'
      and is_active
  );
$$;

revoke all on function private.is_administrator() from public;
revoke all on function private.is_administrator() from anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_administrator() to authenticated;

comment on function private.is_administrator() is
  'Returns whether the current authenticated user has an active, explicitly approved GraveNav administrator profile.';

-- Keep anonymous access to every protected base table and view denied.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

-- Future administrator workflows need these table operations. Row-level
-- policies below still require an active approved administrator profile.
-- Core/history records intentionally omit DELETE and use their existing
-- lifecycle, correction, resolution, or supersession mechanisms instead.
grant select, insert, update on table
  public.import_batches,
  public.cemetery_sites,
  public.cemetery_areas,
  public.sectors,
  public.plot_types,
  public.navigation_nodes,
  public.plots,
  public.navigation_edges,
  public.deceased_persons,
  public.interments,
  public.gravesite_photos,
  public.coordinate_collection_sessions,
  public.map_control_points,
  public.coordinate_observations,
  public.gravesite_coordinates,
  public.coordinate_verifications,
  public.map_features,
  public.import_issues
to authenticated;

-- Navigation graphs and digitized map features are rebuildable application
-- data. Administrators may delete them when a graph or map layer is regenerated.
grant delete on table
  public.navigation_nodes,
  public.navigation_edges,
  public.map_features
to authenticated;

-- Make the history-preserving boundary explicit even if earlier migrations
-- or environment defaults granted broader privileges.
revoke delete on table
  public.import_batches,
  public.cemetery_sites,
  public.cemetery_areas,
  public.sectors,
  public.plot_types,
  public.plots,
  public.deceased_persons,
  public.interments,
  public.gravesite_photos,
  public.coordinate_collection_sessions,
  public.map_control_points,
  public.coordinate_observations,
  public.gravesite_coordinates,
  public.coordinate_verifications,
  public.import_issues
from authenticated;

-- The derived view is security-invoker and therefore retains the underlying
-- plots/interments administrator checks.
grant select on table public.plot_occupancy to authenticated;

-- Authorization profiles are provisioned out of band. Application users,
-- including administrators, receive read-only access through RLS and cannot
-- insert, update, or delete role records through the Data API.
grant select on table public.user_profiles to authenticated;
revoke insert, update, delete on table public.user_profiles from authenticated;

-- Audit history is append-only for application administrators.
grant select, insert on table public.audit_logs to authenticated;
revoke update, delete on table public.audit_logs from authenticated;

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
    'import_issues'
  ] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select private.is_administrator()))',
      table_name || '_administrator_select',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.is_administrator()))',
      table_name || '_administrator_insert',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select private.is_administrator())) with check ((select private.is_administrator()))',
      table_name || '_administrator_update',
      table_name
    );
  end loop;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'navigation_nodes',
    'navigation_edges',
    'map_features'
  ] loop
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select private.is_administrator()))',
      table_name || '_administrator_delete',
      table_name
    );
  end loop;
end;
$$;

create policy user_profiles_administrator_select
on public.user_profiles
for select
to authenticated
using ((select private.is_administrator()));

create policy audit_logs_administrator_select
on public.audit_logs
for select
to authenticated
using ((select private.is_administrator()));

create policy audit_logs_administrator_insert
on public.audit_logs
for insert
to authenticated
with check ((select private.is_administrator()));
