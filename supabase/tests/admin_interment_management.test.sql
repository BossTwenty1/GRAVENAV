begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

insert into auth.users (id, email) values
  ('60000000-0000-4000-8000-000000000001', 'task5b-admin@example.invalid'),
  ('60000000-0000-4000-8000-000000000002', 'task5b-nonadmin@example.invalid');
insert into public.user_profiles (id, application_role, display_name, is_active) values
  ('60000000-0000-4000-8000-000000000001', 'administrator', '[TEST ONLY] Task 5B administrator', true);

insert into public.cemetery_sites (id, name, code, is_synthetic) values
  ('60000000-0000-4000-8000-000000000010', '[TEST ONLY] Synthetic site', 'T5B-SITE', true);
insert into public.cemetery_areas (id, cemetery_site_id, code, name, is_synthetic) values
  ('60000000-0000-4000-8000-000000000011', '60000000-0000-4000-8000-000000000010', 'T5B-AREA', '[TEST ONLY] Synthetic area', true);
insert into public.sectors (id, cemetery_area_id, identifier, name, is_synthetic) values
  ('60000000-0000-4000-8000-000000000012', '60000000-0000-4000-8000-000000000011', 'T5B-SECTOR', '[TEST ONLY] Synthetic sector', true);
insert into public.plot_types (id, code, name, regular_interment_capacity, is_synthetic) values
  ('60000000-0000-4000-8000-000000000013', 'T5B-TWO', '[TEST ONLY] Capacity two', 2, true),
  ('60000000-0000-4000-8000-000000000014', 'T5B-OPEN', '[TEST ONLY] Capacity not configured', null, true);
insert into public.plots (id, cemetery_site_id, cemetery_area_id, sector_id, normalized_plot_identifier, normalized_lot_key, plot_type_id, source_commercial_status, is_synthetic) values
  ('60000000-0000-4000-8000-000000000020', '60000000-0000-4000-8000-000000000010', '60000000-0000-4000-8000-000000000011', '60000000-0000-4000-8000-000000000012', 'T5B-PLOT-A', 't5b-plot-a', '60000000-0000-4000-8000-000000000013', 'BOOKED', true),
  ('60000000-0000-4000-8000-000000000021', '60000000-0000-4000-8000-000000000010', '60000000-0000-4000-8000-000000000011', '60000000-0000-4000-8000-000000000012', 'T5B-PLOT-B', 't5b-plot-b', '60000000-0000-4000-8000-000000000013', 'AVAILABLE', true),
  ('60000000-0000-4000-8000-000000000022', '60000000-0000-4000-8000-000000000010', '60000000-0000-4000-8000-000000000011', '60000000-0000-4000-8000-000000000012', 'T5B-PLOT-C', 't5b-plot-c', '60000000-0000-4000-8000-000000000014', 'HOLD', true),
  ('60000000-0000-4000-8000-000000000023', '60000000-0000-4000-8000-000000000010', '60000000-0000-4000-8000-000000000011', '60000000-0000-4000-8000-000000000012', 'T5B-PLOT-D', 't5b-plot-d', '60000000-0000-4000-8000-000000000013', 'AVAILABLE', true);
insert into public.deceased_persons (id, source_display_name, date_of_death, is_synthetic) values
  ('60000000-0000-4000-8000-000000000030', '[TEST ONLY] Synthetic Alpha', '2020-01-01', true),
  ('60000000-0000-4000-8000-000000000031', '[TEST ONLY] Synthetic Beta', '2021-01-01', true),
  ('60000000-0000-4000-8000-000000000032', '[TEST ONLY] Synthetic Gamma', '2022-01-01', true),
  ('60000000-0000-4000-8000-000000000033', '[TEST ONLY] Synthetic Delta', null, true);
insert into public.interments (id, deceased_person_id, plot_id, interment_date, state, is_synthetic) values
  ('60000000-0000-4000-8000-000000000040', '60000000-0000-4000-8000-000000000032', '60000000-0000-4000-8000-000000000022', '2022-01-02', 'archived', true);

select extensions.is(
  (select derived_occupancy_status::text from public.plot_occupancy where plot_id = '60000000-0000-4000-8000-000000000022'),
  'unoccupied', 'archived history does not consume unknown capacity'
);

select extensions.is(
  (select derived_occupancy_status::text from public.plot_occupancy where plot_id = '60000000-0000-4000-8000-000000000020'),
  'unoccupied',
  'a BOOKED plot with no active interment remains physically unoccupied'
);

set local role anon;
select extensions.throws_ok(
  $$select public.create_interment('60000000-0000-4000-8000-000000000030','60000000-0000-4000-8000-000000000020','2020-01-02',null,null,null,false)$$,
  '42501', null, 'anonymous users cannot execute interment creation'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '60000000-0000-4000-8000-000000000002', true);
select extensions.throws_ok(
  $$select public.create_interment('60000000-0000-4000-8000-000000000030','60000000-0000-4000-8000-000000000020','2020-01-02',null,null,null,false)$$,
  '42501', 'administrator_required', 'an authenticated non-administrator cannot create an interment'
);

select set_config('request.jwt.claim.sub', '60000000-0000-4000-8000-000000000001', true);
select extensions.lives_ok(
  $$select public.create_interment('60000000-0000-4000-8000-000000000030','60000000-0000-4000-8000-000000000020','2020-01-02',' synthetic   type ',1,' synthetic status ',false)$$,
  'an Administrator can create the first valid interment'
);
create temporary table task5b_original_interment as
select id from public.interments
where deceased_person_id = '60000000-0000-4000-8000-000000000030'
  and plot_id = '60000000-0000-4000-8000-000000000020';
select extensions.results_eq(
  $$select deceased_person_id, plot_id, interment_date, interment_type, position_sequence, permanence_status from public.interments where deceased_person_id = '60000000-0000-4000-8000-000000000030' and plot_id = '60000000-0000-4000-8000-000000000020'$$,
  $$values ('60000000-0000-4000-8000-000000000030'::uuid, '60000000-0000-4000-8000-000000000020'::uuid, '2020-01-02'::date, 'synthetic type'::text, 1, 'synthetic status'::text)$$,
  'creation preserves the selected UUID relationships and normalized optional schema values'
);
select extensions.is(
  (select derived_occupancy_status::text from public.plot_occupancy where plot_id = '60000000-0000-4000-8000-000000000020'),
  'occupied', 'the first active interment changes occupancy to occupied'
);
select extensions.is(
  (select source_commercial_status from public.plot_occupancy where plot_id = '60000000-0000-4000-8000-000000000020'),
  'BOOKED', 'commercial status remains separate and unchanged'
);
select extensions.throws_ok(
  $$select public.create_interment('60000000-0000-4000-8000-000000000031','60000000-0000-4000-8000-000000000020','2021-01-02',null,null,null,false)$$,
  'P0001', 'occupied_plot_confirmation_required', 'a second interment requires deliberate occupied-plot confirmation'
);
select extensions.lives_ok(
  $$select public.create_interment('60000000-0000-4000-8000-000000000031','60000000-0000-4000-8000-000000000020','2021-01-02',null,null,null,true)$$,
  'a distinct second interment is allowed after deliberate confirmation'
);
select extensions.is(
  (select derived_occupancy_status::text from public.plot_occupancy where plot_id = '60000000-0000-4000-8000-000000000020'),
  'multiple_interments', 'two active interments derive multiple_interments occupancy'
);
select extensions.throws_ok(
  $$select public.create_interment('60000000-0000-4000-8000-000000000030','60000000-0000-4000-8000-000000000020','2020-01-02',null,null,null,true)$$,
  'P0001', 'duplicate_interment', 'an exact deceased, plot, and date duplicate is rejected'
);
select extensions.throws_ok(
  $$select public.create_interment('60000000-0000-4000-8000-000000000032','60000000-0000-4000-8000-000000000020','2022-01-02',null,null,null,true)$$,
  'P0001', 'plot_capacity_reached', 'configured capacity prevents silent over-capacity creation'
);
select extensions.throws_ok(
  $$select public.create_interment('60000000-0000-4000-8000-000000000032','60000000-0000-4000-8000-000000000022','2021-12-31',null,null,null,false)$$,
  'P0001', 'interment_before_death', 'an interment before the recorded death date is rejected'
);
select extensions.lives_ok(
  $$select public.create_interment('60000000-0000-4000-8000-000000000033','60000000-0000-4000-8000-000000000022',null,null,null,null,false)$$,
  'a missing optional death and interment date are not fabricated or rejected'
);
select extensions.throws_ok(
  $$select public.create_interment('60000000-0000-4000-8000-000000000030','60000000-0000-4000-8000-000000000022','2020-02-01',null,null,null,false)$$,
  'P0001', 'plot_capacity_unknown', 'a second active interment is blocked when capacity is unknown'
);
select extensions.throws_ok(
  $$select public.create_interment('60000000-0000-4000-8000-000000000030','60000000-0000-4000-8000-000000000022','2020-02-01',null,null,null,true)$$,
  'P0001', 'plot_capacity_unknown', 'Administrator confirmation cannot override unknown capacity'
);
select extensions.lives_ok(
  $$select public.create_interment('60000000-0000-4000-8000-000000000030','60000000-0000-4000-8000-000000000023','2020-02-01',null,null,null,false)$$,
  'the same deceased can have a legitimately different interment context'
);

select extensions.lives_ok(
  $$select public.create_interment('60000000-0000-4000-8000-000000000032','60000000-0000-4000-8000-000000000021','2022-01-02',null,null,null,false)$$,
  'the correction destination begins with one valid active interment'
);
select extensions.lives_ok(
  $$select public.update_interment((select id from public.interments where deceased_person_id='60000000-0000-4000-8000-000000000030' and plot_id='60000000-0000-4000-8000-000000000020'),'60000000-0000-4000-8000-000000000030','60000000-0000-4000-8000-000000000020','2020-01-03','corrected synthetic type',1,'synthetic status','active',false)$$,
  'an in-place date correction is allowed even when the plot is at capacity'
);
select extensions.results_eq(
  $$select interment_date, interment_type from public.interments where deceased_person_id='60000000-0000-4000-8000-000000000030' and plot_id='60000000-0000-4000-8000-000000000020'$$,
  $$values ('2020-01-03'::date, 'corrected synthetic type'::text)$$,
  'the correction updates the managed values'
);
select extensions.throws_ok(
  $$select public.update_interment((select id from public.interments where deceased_person_id='60000000-0000-4000-8000-000000000030' and plot_id='60000000-0000-4000-8000-000000000020'),'60000000-0000-4000-8000-000000000030','60000000-0000-4000-8000-000000000021','2020-01-03','corrected synthetic type',1,'synthetic status','active',false)$$,
  'P0001', 'occupied_plot_confirmation_required', 'moving to an occupied plot requires confirmation'
);
select extensions.lives_ok(
  $$select public.update_interment((select id from public.interments where deceased_person_id='60000000-0000-4000-8000-000000000030' and plot_id='60000000-0000-4000-8000-000000000020'),'60000000-0000-4000-8000-000000000030','60000000-0000-4000-8000-000000000021','2020-01-03','corrected synthetic type',1,'synthetic status','active',true)$$,
  'a confirmed move to a plot below capacity succeeds'
);
select extensions.throws_ok(
  $$select public.update_interment((select id from public.interments where deceased_person_id='60000000-0000-4000-8000-000000000031' and plot_id='60000000-0000-4000-8000-000000000020'),'60000000-0000-4000-8000-000000000031','60000000-0000-4000-8000-000000000022','2021-01-02',null,null,null,'active',true)$$,
  'P0001', 'plot_capacity_unknown', 'moving into an occupied unknown-capacity plot is blocked even with confirmation'
);
select extensions.is(
  (select count(distinct id)::integer from public.interments where deceased_person_id='60000000-0000-4000-8000-000000000030'),
  2, 'correction preserves the moved interment UUID and the separate legitimate context'
);
select extensions.results_eq(
  $$select id from public.interments where deceased_person_id='60000000-0000-4000-8000-000000000030' and plot_id='60000000-0000-4000-8000-000000000021'$$,
  $$select id from task5b_original_interment$$,
  'moving an interment retains its exact UUID'
);
select extensions.is(
  (select derived_occupancy_status::text from public.plot_occupancy where plot_id='60000000-0000-4000-8000-000000000020'),
  'occupied', 'source plot occupancy recalculates after a move'
);
select extensions.is(
  (select derived_occupancy_status::text from public.plot_occupancy where plot_id='60000000-0000-4000-8000-000000000021'),
  'multiple_interments', 'destination plot occupancy recalculates after a move'
);
select extensions.lives_ok(
  $$select public.update_interment((select id from public.interments where deceased_person_id='60000000-0000-4000-8000-000000000030' and plot_id='60000000-0000-4000-8000-000000000021'),'60000000-0000-4000-8000-000000000030','60000000-0000-4000-8000-000000000021','2020-01-03','corrected synthetic type',1,'synthetic status','archived',false)$$,
  'an interment can use the existing archived lifecycle without deletion'
);
select extensions.is(
  (select derived_occupancy_status::text from public.plot_occupancy where plot_id='60000000-0000-4000-8000-000000000021'),
  'occupied', 'archived interments no longer count toward occupancy'
);
select extensions.throws_ok(
  $$select public.update_interment((select id from public.interments where deceased_person_id='60000000-0000-4000-8000-000000000030' and plot_id='60000000-0000-4000-8000-000000000021'),'60000000-0000-4000-8000-000000000030','60000000-0000-4000-8000-000000000021','2020-01-03','corrected synthetic type',1,'synthetic status','active',false)$$,
  'P0001', 'occupied_plot_confirmation_required', 'reactivation also requires occupied-plot confirmation'
);

select extensions.is(
  (select count(*)::integer from public.audit_logs where action='interment.created'),
  5, 'each successful application-style creation appends one audit event'
);
select extensions.is(
  (select count(*)::integer from public.audit_logs where action='interment.updated'),
  3, 'each successful correction appends one audit event'
);
select extensions.ok(
  not exists (select 1 from public.audit_logs where action like 'interment.%' and (before_data is not null or after_data is not null)),
  'interment audit events contain no before or after payload snapshots'
);
select extensions.ok(
  (select bool_and(changed_fields <@ '["deceased_person_id","plot_id","interment_date","interment_type","position_sequence","permanence_status","state"]'::jsonb) from public.audit_logs where action like 'interment.%'),
  'interment audit events contain only approved changed field names'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.interments', 'delete'),
  'authenticated retains no interment DELETE grant'
);
select extensions.is(
  (select count(*)::integer from pg_policies where schemaname='public' and tablename='interments' and cmd='DELETE'),
  0, 'no interment DELETE RLS policy exists'
);
select extensions.is(
  (select count(*)::integer from pg_proc join pg_namespace on pg_namespace.oid=pg_proc.pronamespace where nspname='public' and proname like '%interment%delete%'),
  0, 'no interment DELETE function exists'
);
select extensions.throws_ok(
  $$delete from public.interments where false$$,
  '42501', null, 'Administrators cannot hard-delete interments'
);

reset role;
select * from extensions.finish();
rollback;
