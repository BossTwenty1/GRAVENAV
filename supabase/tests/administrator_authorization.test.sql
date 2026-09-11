begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(71);

select extensions.ok(
  not has_schema_privilege('anon', 'private', 'usage'),
  'anon cannot access the private authorization schema'
);
select extensions.ok(
  has_schema_privilege('authenticated', 'private', 'usage'),
  'authenticated can resolve the private authorization helper used by RLS'
);
select extensions.ok(
  not has_function_privilege('anon', 'private.is_administrator()', 'execute'),
  'anon cannot execute the administrator helper'
);
select extensions.ok(
  has_function_privilege('authenticated', 'private.is_administrator()', 'execute'),
  'authenticated can execute only the boolean administrator helper'
);
select extensions.results_eq(
  $$select count(*)::bigint from pg_policies where schemaname = 'public'$$,
  $$values (60::bigint)$$,
  'all protected tables have the expected operation-specific policies'
);

select extensions.ok(
  not has_table_privilege('anon', 'public.cemetery_sites', 'select'),
  'anon has no protected-table SELECT grant'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.plot_types', 'insert'),
  'anon has no protected-table INSERT grant'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.cemetery_sites', 'update'),
  'anon has no protected-table UPDATE grant'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.cemetery_sites', 'delete'),
  'anon has no protected-table DELETE grant'
);

set local role anon;
select extensions.throws_ok(
  $$select * from public.cemetery_sites$$,
  '42501',
  null,
  'anon cannot read a protected base table'
);
select extensions.throws_ok(
  $$insert into public.plot_types (code, name) values ('ANON', 'Anonymous attempt')$$,
  '42501',
  null,
  'anon cannot insert a protected record'
);
select extensions.throws_ok(
  $$update public.cemetery_sites set name = 'Anonymous attempt'$$,
  '42501',
  null,
  'anon cannot update a protected record'
);
select extensions.throws_ok(
  $$delete from public.cemetery_sites$$,
  '42501',
  null,
  'anon cannot delete a protected record'
);
reset role;

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'task3-unauthorized@example.invalid',
    '',
    now(),
    '{}',
    '{}',
    now(),
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'task3-administrator@example.invalid',
    '',
    now(),
    '{}',
    '{}',
    now(),
    now()
  );

insert into public.user_profiles (id, application_role, display_name, is_active)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'administrator',
    '[TEST ONLY] Inactive account',
    false
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'administrator',
    '[TEST ONLY] Approved administrator',
    true
  );

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select extensions.is(
  private.is_administrator(),
  false,
  'an authenticated inactive profile is not an authorized administrator'
);
select extensions.results_eq(
  $$select count(*)::bigint from public.cemetery_sites$$,
  $$values (0::bigint)$$,
  'an authenticated non-admin cannot read cemetery hierarchy data'
);
select extensions.results_eq(
  $$select count(*)::bigint from public.deceased_persons$$,
  $$values (0::bigint)$$,
  'an authenticated non-admin cannot read deceased-person data'
);
select extensions.results_eq(
  $$select count(*)::bigint from public.coordinate_observations$$,
  $$values (0::bigint)$$,
  'an authenticated non-admin cannot read coordinate observations'
);
select extensions.results_eq(
  $$select count(*)::bigint from public.import_batches$$,
  $$values (0::bigint)$$,
  'an authenticated non-admin cannot read import data'
);
select extensions.results_eq(
  $$select count(*)::bigint from public.audit_logs$$,
  $$values (0::bigint)$$,
  'an authenticated non-admin cannot read audit history'
);
select extensions.throws_ok(
  $$insert into public.plot_types (code, name) values ('NONADMIN', 'Unauthorized attempt')$$,
  '42501',
  null,
  'an authenticated non-admin cannot insert protected records'
);
select extensions.results_eq(
  $$with changed as (update public.cemetery_sites set name = 'Unauthorized attempt' returning 1) select count(*)::bigint from changed$$,
  $$values (0::bigint)$$,
  'an authenticated non-admin cannot update protected records'
);
select extensions.throws_ok(
  $$delete from public.cemetery_sites$$,
  '42501',
  null,
  'an authenticated non-admin cannot delete protected records'
);
select extensions.throws_ok(
  $$update public.user_profiles set is_active = true where id = '10000000-0000-4000-8000-000000000001'$$,
  '42501',
  null,
  'a user cannot activate or promote their own authorization profile'
);

reset role;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;

select extensions.is(
  private.is_administrator(),
  true,
  'an active approved profile authorizes the authenticated administrator'
);
select extensions.ok(
  (select count(*) > 0 from public.cemetery_sites),
  'an administrator can read cemetery hierarchy data'
);
select extensions.ok(
  (select count(*) > 0 from public.deceased_persons),
  'an administrator can read deceased-person data'
);
select extensions.ok(
  (select count(*) > 0 from public.interments),
  'an administrator can read interment data'
);
select extensions.ok(
  (select count(*) > 0 from public.coordinate_observations),
  'an administrator can read coordinate data'
);
select extensions.ok(
  (select count(*) > 0 from public.plot_occupancy),
  'an administrator can read the security-invoker occupancy view'
);

select extensions.lives_ok(
  $$insert into public.plot_types (id, code, name, is_synthetic) values ('20000000-0000-4000-8000-000000000001', 'TASK3', '[TEST ONLY] Task 3 plot type', true)$$,
  'an administrator can insert a protected record'
);
select extensions.results_eq(
  $$update public.plot_types set name = '[TEST ONLY] Updated plot type', is_active = false where id = '20000000-0000-4000-8000-000000000001' returning name, is_active$$,
  $$values ('[TEST ONLY] Updated plot type'::text, false)$$,
  'an administrator can correct and deactivate configurable records'
);

select extensions.lives_ok(
  $$insert into public.coordinate_collection_sessions (id, session_identifier, notes, is_synthetic) values ('20000000-0000-4000-8000-000000000002', 'TASK3-TEST-SESSION', '[TEST ONLY] Security test', true)$$,
  'an administrator can insert coordinate workflow data'
);
select extensions.results_eq(
  $$update public.coordinate_collection_sessions set notes = '[TEST ONLY] Corrected security test' where id = '20000000-0000-4000-8000-000000000002' returning notes$$,
  $$values ('[TEST ONLY] Corrected security test'::text)$$,
  'an administrator can correct coordinate-session history without deleting it'
);
select extensions.lives_ok(
  $$insert into public.map_features (id, cemetery_site_id, feature_type, label, is_synthetic) values ('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'test-only', '[TEST ONLY] Security test', true)$$,
  'an administrator can insert mapping data'
);
select extensions.lives_ok(
  $$delete from public.map_features where id = '20000000-0000-4000-8000-000000000003'$$,
  'an administrator can delete mapping data'
);
select extensions.lives_ok(
  $$insert into public.import_batches (id, source_label, import_type, notes) values ('20000000-0000-4000-8000-000000000004', '[TEST ONLY] Security test', 'test-only', '[TEST ONLY] Not client data')$$,
  'an administrator can insert import workflow data'
);
select extensions.results_eq(
  $$update public.import_batches set status = 'cancelled' where id = '20000000-0000-4000-8000-000000000004' returning status::text$$,
  $$values ('cancelled'::text)$$,
  'an administrator can manage import history through its lifecycle status'
);

select extensions.results_eq(
  $$select table_name::text collate "C" from information_schema.role_table_grants where grantee = 'authenticated' and table_schema = 'public' and privilege_type = 'DELETE' order by table_name collate "C"$$,
  $$values ('map_features'::text collate "C"), ('navigation_edges'::text collate "C"), ('navigation_nodes'::text collate "C")$$,
  'only explicitly rebuildable application tables retain authenticated DELETE grants'
);

select extensions.results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and cmd = 'DELETE'
      and tablename in (
        'import_batches',
        'cemetery_sites',
        'cemetery_areas',
        'sectors',
        'plot_types',
        'plots',
        'deceased_persons',
        'interments',
        'gravesite_photos',
        'coordinate_collection_sessions',
        'map_control_points',
        'coordinate_observations',
        'gravesite_coordinates',
        'coordinate_verifications',
        'import_issues'
      )
  $$,
  $$values (0::bigint)$$,
  'historical and core tables have no administrator DELETE policies'
);

select extensions.throws_ok(
  $$delete from public.import_batches where false$$,
  '42501', null,
  'administrators cannot hard-delete import batch history'
);
select extensions.throws_ok(
  $$delete from public.cemetery_sites where false$$,
  '42501', null,
  'administrators cannot hard-delete cemetery sites'
);
select extensions.throws_ok(
  $$delete from public.cemetery_areas where false$$,
  '42501', null,
  'administrators cannot hard-delete cemetery areas'
);
select extensions.throws_ok(
  $$delete from public.sectors where false$$,
  '42501', null,
  'administrators cannot hard-delete cemetery sectors'
);
select extensions.throws_ok(
  $$delete from public.plot_types where false$$,
  '42501', null,
  'administrators cannot hard-delete plot types'
);
select extensions.throws_ok(
  $$delete from public.plots where false$$,
  '42501', null,
  'administrators cannot hard-delete plots'
);
select extensions.throws_ok(
  $$delete from public.deceased_persons where false$$,
  '42501', null,
  'administrators cannot hard-delete deceased-person records'
);
select extensions.throws_ok(
  $$delete from public.interments where false$$,
  '42501', null,
  'administrators cannot hard-delete interment history'
);
select extensions.throws_ok(
  $$delete from public.gravesite_photos where false$$,
  '42501', null,
  'administrators cannot hard-delete gravesite-photo metadata'
);
select extensions.throws_ok(
  $$delete from public.coordinate_collection_sessions where false$$,
  '42501', null,
  'administrators cannot hard-delete coordinate collection sessions'
);
select extensions.throws_ok(
  $$delete from public.map_control_points where false$$,
  '42501', null,
  'administrators cannot hard-delete map control-point history'
);
select extensions.throws_ok(
  $$delete from public.coordinate_observations where false$$,
  '42501', null,
  'administrators cannot hard-delete raw coordinate observations'
);
select extensions.throws_ok(
  $$delete from public.gravesite_coordinates where false$$,
  '42501', null,
  'administrators cannot hard-delete current or superseded gravesite coordinates'
);
select extensions.throws_ok(
  $$delete from public.coordinate_verifications where false$$,
  '42501', null,
  'administrators cannot hard-delete coordinate verification history'
);
select extensions.throws_ok(
  $$delete from public.import_issues where false$$,
  '42501', null,
  'administrators cannot hard-delete import provenance or issue history'
);

select extensions.lives_ok(
  $$insert into public.navigation_nodes (id, cemetery_site_id, node_type, is_synthetic) values ('20000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000001', 'test-only', true), ('20000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000001', 'test-only', true)$$,
  'an administrator can create rebuildable navigation nodes'
);
select extensions.lives_ok(
  $$insert into public.navigation_edges (id, from_node_id, to_node_id, is_synthetic) values ('20000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000007', true)$$,
  'an administrator can create rebuildable navigation edges'
);
select extensions.results_eq(
  $$delete from public.navigation_edges where id = '20000000-0000-4000-8000-000000000008' returning id$$,
  $$values ('20000000-0000-4000-8000-000000000008'::uuid)$$,
  'an administrator can delete a regenerated navigation edge'
);
select extensions.results_eq(
  $$with removed as (delete from public.navigation_nodes where id in ('20000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000007') returning 1) select count(*)::bigint from removed$$,
  $$values (2::bigint)$$,
  'an administrator can delete unreferenced regenerated navigation nodes'
);

select extensions.lives_ok(
  $$insert into public.audit_logs (id, actor_reference, action, entity_type) values ('20000000-0000-4000-8000-000000000005', 'task3-test', 'test-only', 'test-only')$$,
  'an administrator can append an audit record'
);
select extensions.results_eq(
  $$select action from public.audit_logs where id = '20000000-0000-4000-8000-000000000005'$$,
  $$values ('test-only'::text)$$,
  'an administrator can read audit history'
);
select extensions.throws_ok(
  $$update public.audit_logs set action = 'tampered' where id = '20000000-0000-4000-8000-000000000005'$$,
  '42501',
  null,
  'an administrator cannot update historical audit records'
);
select extensions.throws_ok(
  $$delete from public.audit_logs where id = '20000000-0000-4000-8000-000000000005'$$,
  '42501',
  null,
  'an administrator cannot delete historical audit records'
);
select extensions.throws_ok(
  $$update public.user_profiles set application_role = 'administrator' where id = '10000000-0000-4000-8000-000000000002'$$,
  '42501',
  null,
  'administrators cannot mutate authorization profiles through application grants'
);

reset role;

select extensions.ok(
  has_table_privilege('authenticated', 'public.audit_logs', 'select'),
  'authenticated has the audit SELECT grant required by administrator policy'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.audit_logs', 'insert'),
  'authenticated has the audit INSERT grant required by administrator policy'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.audit_logs', 'update'),
  'authenticated has no audit UPDATE grant'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.audit_logs', 'delete'),
  'authenticated has no audit DELETE grant'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.user_profiles', 'select'),
  'authenticated has profile SELECT for administrator checks'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.user_profiles', 'insert'),
  'authenticated has no profile INSERT grant'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.user_profiles', 'update'),
  'authenticated has no profile UPDATE grant'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.user_profiles', 'delete'),
  'authenticated has no profile DELETE grant'
);

select * from extensions.finish();
rollback;
