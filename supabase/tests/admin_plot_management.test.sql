begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

insert into auth.users (id, email) values
  ('70000000-0000-4000-8000-000000000001', 'task5c-admin@example.invalid'),
  ('70000000-0000-4000-8000-000000000002', 'task5c-nonadmin@example.invalid');
insert into public.user_profiles (id, application_role, display_name, is_active) values
  ('70000000-0000-4000-8000-000000000001', 'administrator', '[TEST ONLY] Task 5C administrator', true);

insert into public.cemetery_sites (id, name, code, is_synthetic) values
  ('70000000-0000-4000-8000-000000000010', '[TEST ONLY] Synthetic site A', 'T5C-A', true),
  ('70000000-0000-4000-8000-000000000011', '[TEST ONLY] Synthetic site B', 'T5C-B', true);
insert into public.cemetery_areas (id, cemetery_site_id, code, name, is_synthetic) values
  ('70000000-0000-4000-8000-000000000020', '70000000-0000-4000-8000-000000000010', 'T5C-AREA-A', '[TEST ONLY] Synthetic area A', true),
  ('70000000-0000-4000-8000-000000000021', '70000000-0000-4000-8000-000000000011', 'T5C-AREA-B', '[TEST ONLY] Synthetic area B', true);
insert into public.sectors (id, cemetery_area_id, identifier, name, is_synthetic) values
  ('70000000-0000-4000-8000-000000000030', '70000000-0000-4000-8000-000000000020', 'T5C-SECTOR-A', '[TEST ONLY] Synthetic sector A', true),
  ('70000000-0000-4000-8000-000000000031', '70000000-0000-4000-8000-000000000020', 'T5C-SECTOR-B', '[TEST ONLY] Synthetic sector B', true),
  ('70000000-0000-4000-8000-000000000032', '70000000-0000-4000-8000-000000000021', 'T5C-SECTOR-C', '[TEST ONLY] Synthetic sector C', true);
insert into public.plot_types (id, code, name, regular_interment_capacity, is_synthetic) values
  ('70000000-0000-4000-8000-000000000040', 'T5C-TWO', '[TEST ONLY] Capacity two', 2, true),
  ('70000000-0000-4000-8000-000000000041', 'T5C-ONE', '[TEST ONLY] Capacity one', 1, true),
  ('70000000-0000-4000-8000-000000000042', 'T5C-UNKNOWN', '[TEST ONLY] Capacity unknown', null, true);
insert into public.plots (id, cemetery_site_id, cemetery_area_id, sector_id, normalized_plot_identifier, normalized_lot_key, plot_type_id, source_commercial_status, is_synthetic) values
  ('70000000-0000-4000-8000-000000000050', '70000000-0000-4000-8000-000000000010', '70000000-0000-4000-8000-000000000020', '70000000-0000-4000-8000-000000000030', 'T5C-EMPTY', 't5c-empty', '70000000-0000-4000-8000-000000000040', 'BOOKED', true),
  ('70000000-0000-4000-8000-000000000051', '70000000-0000-4000-8000-000000000010', '70000000-0000-4000-8000-000000000020', '70000000-0000-4000-8000-000000000030', 'T5C-ONE', 't5c-one', '70000000-0000-4000-8000-000000000040', 'AVAILABLE', true),
  ('70000000-0000-4000-8000-000000000052', '70000000-0000-4000-8000-000000000010', '70000000-0000-4000-8000-000000000020', '70000000-0000-4000-8000-000000000030', 'T5C-MULTI', 't5c-multi', '70000000-0000-4000-8000-000000000040', 'HOLD', true),
  ('70000000-0000-4000-8000-000000000053', '70000000-0000-4000-8000-000000000010', '70000000-0000-4000-8000-000000000020', '70000000-0000-4000-8000-000000000030', 'T5C-HISTORY', 't5c-history', '70000000-0000-4000-8000-000000000042', null, true);
insert into public.deceased_persons (id, source_display_name, is_synthetic) values
  ('70000000-0000-4000-8000-000000000060', '[TEST ONLY] Synthetic Alpha', true),
  ('70000000-0000-4000-8000-000000000061', '[TEST ONLY] Synthetic Beta', true),
  ('70000000-0000-4000-8000-000000000062', '[TEST ONLY] Synthetic Gamma', true),
  ('70000000-0000-4000-8000-000000000063', '[TEST ONLY] Synthetic Archive', true);
insert into public.interments (id, deceased_person_id, plot_id, interment_date, state, is_synthetic) values
  ('70000000-0000-4000-8000-000000000070', '70000000-0000-4000-8000-000000000060', '70000000-0000-4000-8000-000000000051', '2020-01-01', 'active', true),
  ('70000000-0000-4000-8000-000000000071', '70000000-0000-4000-8000-000000000061', '70000000-0000-4000-8000-000000000052', '2021-01-01', 'active', true),
  ('70000000-0000-4000-8000-000000000072', '70000000-0000-4000-8000-000000000062', '70000000-0000-4000-8000-000000000052', '2022-01-01', 'active', true),
  ('70000000-0000-4000-8000-000000000073', '70000000-0000-4000-8000-000000000063', '70000000-0000-4000-8000-000000000053', '2019-01-01', 'archived', true);

select extensions.results_eq(
  $$select derived_occupancy_status::text, active_interment_count from public.plot_occupancy where plot_id='70000000-0000-4000-8000-000000000050'$$,
  $$values ('unoccupied'::text, 0)$$,
  'empty plots derive unoccupied status'
);
select extensions.results_eq(
  $$select derived_occupancy_status::text, active_interment_count from public.plot_occupancy where plot_id='70000000-0000-4000-8000-000000000051'$$,
  $$values ('occupied'::text, 1)$$,
  'one active interment derives occupied status'
);
select extensions.results_eq(
  $$select derived_occupancy_status::text, active_interment_count from public.plot_occupancy where plot_id='70000000-0000-4000-8000-000000000052'$$,
  $$values ('multiple_interments'::text, 2)$$,
  'multiple active interments derive multiple_interments status'
);
select extensions.results_eq(
  $$select derived_occupancy_status::text, active_interment_count from public.plot_occupancy where plot_id='70000000-0000-4000-8000-000000000053'$$,
  $$values ('unoccupied'::text, 0)$$,
  'archived interments do not inflate active occupancy'
);
select extensions.is(
  (select source_commercial_status from public.plot_occupancy where plot_id='70000000-0000-4000-8000-000000000050'),
  'BOOKED', 'commercial status remains separate from unoccupied physical status'
);

set local role anon;
select extensions.throws_ok(
  $$select public.create_plot('70000000-0000-4000-8000-000000000010','70000000-0000-4000-8000-000000000020','70000000-0000-4000-8000-000000000030','T5C-NEW','70000000-0000-4000-8000-000000000040')$$,
  '42501', null, 'anonymous users cannot create plots'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000002', true);
select extensions.throws_ok(
  $$select public.create_plot('70000000-0000-4000-8000-000000000010','70000000-0000-4000-8000-000000000020','70000000-0000-4000-8000-000000000030','T5C-NEW','70000000-0000-4000-8000-000000000040')$$,
  '42501', 'administrator_required', 'authenticated non-administrators cannot create plots'
);

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000001', true);
create temporary table task5c_created_plot as
select public.create_plot(
  '70000000-0000-4000-8000-000000000010',
  '70000000-0000-4000-8000-000000000020',
  '70000000-0000-4000-8000-000000000030',
  '  T5C   MANUAL-01  ',
  '70000000-0000-4000-8000-000000000040'
) as id;
select extensions.results_eq(
  $$select cemetery_site_id, cemetery_area_id, sector_id, normalized_plot_identifier, normalized_lot_key, plot_type_id, raw_lot_location from public.plots where id=(select id from task5c_created_plot)$$,
  $$values ('70000000-0000-4000-8000-000000000010'::uuid, '70000000-0000-4000-8000-000000000020'::uuid, '70000000-0000-4000-8000-000000000030'::uuid, 'T5C MANUAL-01'::text, 't5c manual-01'::text, '70000000-0000-4000-8000-000000000040'::uuid, null::text)$$,
  'creation preserves explicit hierarchy and type while normalizing identity without inventing raw provenance'
);
select extensions.results_eq(
  $$select normalized_plot_identifier from public.plots where normalized_lot_key like 't5c manual%' order by normalized_lot_key limit 25$$,
  $$values ('T5C MANUAL-01'::text)$$,
  'normalized plot search remains a bounded database query'
);
select extensions.is(
  (select pt.regular_interment_capacity from public.plots p join public.plot_types pt on pt.id=p.plot_type_id where p.id=(select id from task5c_created_plot)),
  2, 'configured capacity remains inherited from the selected plot type'
);
select extensions.throws_ok(
  $$select public.create_plot('70000000-0000-4000-8000-000000000010','70000000-0000-4000-8000-000000000020','70000000-0000-4000-8000-000000000030','t5c manual-01','70000000-0000-4000-8000-000000000040')$$,
  'P0001', 'duplicate_plot', 'case-normalized duplicate physical plots are rejected without merging'
);
select extensions.throws_ok(
  $$select public.create_plot('70000000-0000-4000-8000-000000000010','70000000-0000-4000-8000-000000000021','70000000-0000-4000-8000-000000000032','T5C-BAD-HIERARCHY','70000000-0000-4000-8000-000000000040')$$,
  'P0001', 'invalid_plot_hierarchy', 'site area and sector UUIDs must form one active hierarchy'
);

select extensions.lives_ok(
  $$select public.update_plot((select id from task5c_created_plot),'70000000-0000-4000-8000-000000000010','70000000-0000-4000-8000-000000000020','70000000-0000-4000-8000-000000000031','T5C MANUAL-02','70000000-0000-4000-8000-000000000040','active',false)$$,
  'an empty plot location can be corrected'
);
select extensions.results_eq(
  $$select id, sector_id, normalized_lot_key from public.plots where id=(select id from task5c_created_plot)$$,
  $$select id, '70000000-0000-4000-8000-000000000031'::uuid, 't5c manual-02'::text from task5c_created_plot$$,
  'location correction preserves the plot UUID'
);
select extensions.throws_ok(
  $$select public.update_plot((select id from task5c_created_plot),'70000000-0000-4000-8000-000000000010','70000000-0000-4000-8000-000000000020','70000000-0000-4000-8000-000000000031','T5C-EMPTY','70000000-0000-4000-8000-000000000040','active',false)$$,
  'P0001', 'duplicate_plot', 'correction to an existing physical identity is rejected'
);
select extensions.throws_ok(
  $$select public.update_plot('70000000-0000-4000-8000-000000000052','70000000-0000-4000-8000-000000000010','70000000-0000-4000-8000-000000000020','70000000-0000-4000-8000-000000000030','T5C-MULTI','70000000-0000-4000-8000-000000000041','active',false)$$,
  'P0001', 'plot_type_capacity_below_active_count', 'plot type capacity cannot be reduced below active occupancy'
);
select extensions.throws_ok(
  $$select public.update_plot('70000000-0000-4000-8000-000000000052','70000000-0000-4000-8000-000000000010','70000000-0000-4000-8000-000000000020','70000000-0000-4000-8000-000000000030','T5C-MULTI','70000000-0000-4000-8000-000000000042','active',false)$$,
  'P0001', 'plot_type_capacity_unknown_for_multiple', 'unknown capacity cannot silently replace a type for multiple active interments'
);
select extensions.throws_ok(
  $$select public.update_plot('70000000-0000-4000-8000-000000000051','70000000-0000-4000-8000-000000000010','70000000-0000-4000-8000-000000000020','70000000-0000-4000-8000-000000000031','T5C-ONE-CORRECTED','70000000-0000-4000-8000-000000000040','active',false)$$,
  'P0001', 'occupied_plot_location_confirmation_required', 'occupied plot location correction requires deliberate confirmation'
);
select extensions.lives_ok(
  $$select public.update_plot('70000000-0000-4000-8000-000000000051','70000000-0000-4000-8000-000000000010','70000000-0000-4000-8000-000000000020','70000000-0000-4000-8000-000000000031','T5C-ONE-CORRECTED','70000000-0000-4000-8000-000000000040','active',true)$$,
  'confirmed occupied location correction succeeds without moving interments'
);
select extensions.results_eq(
  $$select p.id, i.plot_id from public.plots p join public.interments i on i.plot_id=p.id where p.id='70000000-0000-4000-8000-000000000051'$$,
  $$values ('70000000-0000-4000-8000-000000000051'::uuid, '70000000-0000-4000-8000-000000000051'::uuid)$$,
  'occupied location correction preserves both plot UUID and attached interment'
);
select extensions.throws_ok(
  $$select public.update_plot('70000000-0000-4000-8000-000000000051','70000000-0000-4000-8000-000000000010','70000000-0000-4000-8000-000000000020','70000000-0000-4000-8000-000000000031','T5C-ONE-CORRECTED','70000000-0000-4000-8000-000000000040','archived',false)$$,
  'P0001', 'active_interments_prevent_plot_archive', 'plots with active interments cannot be archived'
);
select extensions.lives_ok(
  $$select public.update_plot((select id from task5c_created_plot),'70000000-0000-4000-8000-000000000010','70000000-0000-4000-8000-000000000020','70000000-0000-4000-8000-000000000031','T5C MANUAL-02','70000000-0000-4000-8000-000000000040','archived',false)$$,
  'empty plots can use the existing archived lifecycle without deletion'
);

select extensions.is((select count(*)::integer from public.audit_logs where action='plot.created'), 1, 'plot creation appends one audit event');
select extensions.is((select count(*)::integer from public.audit_logs where action='plot.updated'), 3, 'successful plot corrections append audit events');
select extensions.ok(
  not exists (select 1 from public.audit_logs where action like 'plot.%' and (before_data is not null or after_data is not null)),
  'plot audit events contain no before or after payloads'
);
select extensions.ok(
  (select bool_and(changed_fields <@ '["cemetery_site_id","cemetery_area_id","sector_id","normalized_plot_identifier","normalized_lot_key","plot_type_id","state"]'::jsonb) from public.audit_logs where action like 'plot.%'),
  'plot audit events contain only approved changed field names'
);
select extensions.ok(not has_table_privilege('authenticated', 'public.plots', 'delete'), 'authenticated retains no plot DELETE grant');
select extensions.is((select count(*)::integer from pg_policies where schemaname='public' and tablename='plots' and cmd='DELETE'), 0, 'no plot DELETE RLS policy exists');
select extensions.is((select count(*)::integer from pg_proc join pg_namespace n on n.oid=pronamespace where n.nspname='public' and proname like '%plot%delete%'), 0, 'no plot DELETE function exists');
select extensions.throws_ok($$delete from public.plots where false$$, '42501', null, 'Administrators cannot hard-delete plots');

reset role;
select * from extensions.finish();
rollback;
