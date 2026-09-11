begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

insert into auth.users (id, email) values
 ('40000000-0000-4000-8000-000000000001', 'task4-admin@example.invalid'),
 ('40000000-0000-4000-8000-000000000002', 'task4-nonadmin@example.invalid');
insert into public.user_profiles (id, application_role, is_active) values
 ('40000000-0000-4000-8000-000000000001', 'administrator', true);

create function pg_temp.import_row(p_number text, p_name text, p_hash text, p_status text default null)
returns jsonb language sql as $$
 select jsonb_build_object('row', 2, 'state', 'valid', 'fingerprint', repeat(p_hash,64),
 'key', 'AREA:TEST;SECTOR:TEST;LOT:'||p_number||';TYPE:STD',
 'raw_location', 'AREA:TEST;SECTOR:TEST;LOT:'||p_number||';TYPE:STD',
 'classification', 'STD', 'commercial_status', p_status, 'display_name', p_name,
 'birth', null, 'death', null, 'interment', null);
$$;
create function pg_temp.persist(p_adapter text, p_rows jsonb) returns uuid language sql as $$
 select public.persist_import_plan('00000000-0000-4000-8000-000000000001', p_adapter,
   'synthetic-task4', case when p_adapter = 'inventory-list' then 'Synthetic Inventory' else 'Synthetic Interments' end, p_rows, true);
$$;

set local role anon;
select extensions.throws_ok($$select * from public.import_batches$$, '42501', null, 'anonymous cannot read import batches');
select extensions.throws_ok($$select * from public.import_issues$$, '42501', null, 'anonymous cannot read import issues');
select extensions.throws_ok($$insert into public.import_issues(import_batch_id,issue_code,severity,description) values (gen_random_uuid(),'test','error','test')$$, '42501', null, 'anonymous cannot insert issues');
select extensions.throws_ok($$select pg_temp.persist('inventory-list',jsonb_build_array(pg_temp.import_row('001',null,'a','BOOKED')))$$, '42501', null, 'anonymous cannot execute import RPC');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','40000000-0000-4000-8000-000000000002',true);
select extensions.is((select count(*)::integer from public.import_batches), 0, 'nonadmin cannot read batches');
select extensions.is((select count(*)::integer from public.import_issues), 0, 'nonadmin cannot read issues');
select extensions.throws_ok($$insert into public.import_batches(source_label,import_type) values('synthetic','test')$$,'42501',null,'nonadmin cannot insert batches');
select extensions.throws_ok($$insert into public.import_issues(import_batch_id,issue_code,severity,description) values (gen_random_uuid(),'test','error','test')$$,'42501',null,'nonadmin cannot insert issues');
select extensions.throws_ok($$select pg_temp.persist('inventory-list',jsonb_build_array(pg_temp.import_row('001',null,'a','BOOKED')))$$,'42501',null,'nonadmin cannot persist');

select set_config('request.jwt.claim.sub','40000000-0000-4000-8000-000000000001',true);
select extensions.lives_ok($$select pg_temp.persist('inventory-list',jsonb_build_array(pg_temp.import_row('001',null,'a','BOOKED')))$$, 'Administrator persists normalized BOOKED inventory');
select extensions.is((select derived_occupancy_status::text from public.plot_occupancy where normalized_plot_identifier = 'AREA:TEST;SECTOR:TEST;LOT:001;TYPE:STD'),'unoccupied','BOOKED without interments is unoccupied');
select extensions.lives_ok($$insert into public.import_issues(import_batch_id,source_row_reference,issue_code,severity,field_name,description) select id,'2','synthetic_review','warning','location','Synthetic review only' from public.import_batches where source_label='synthetic-task4' limit 1$$,'Administrator creates import issues');
select extensions.is((select count(*)::integer from public.import_issues where issue_code='synthetic_review'),1,'Administrator reads issues');
select extensions.lives_ok($$select pg_temp.persist('inventory-list',jsonb_build_array(pg_temp.import_row('001',null,'a','BOOKED')))$$,'repeat inventory import is idempotent');
select extensions.is((select count(*)::integer from public.plots where normalized_lot_key='AREA:TEST;SECTOR:TEST;LOT:001;TYPE:STD'),1,'repeat inventory does not duplicate plot');
select extensions.lives_ok($$select pg_temp.persist('interment-summary',jsonb_build_array(pg_temp.import_row('001',' Synthetic  Alpha Jr. ','b')))$$,'first interment persists');
select extensions.is((select display_name from public.deceased_persons where source_display_name=' Synthetic  Alpha Jr. '),' Synthetic  Alpha Jr. ','source display name survives without invented components');
select extensions.is((select given_name from public.deceased_persons where source_display_name=' Synthetic  Alpha Jr. '),null::text,'name parts remain absent');
select extensions.lives_ok($$select pg_temp.persist('interment-summary',jsonb_build_array(pg_temp.import_row('001','Synthetic Beta','c')))$$,'second interment on same plot persists');
select extensions.is((select derived_occupancy_status::text from public.plot_occupancy where normalized_plot_identifier = 'AREA:TEST;SECTOR:TEST;LOT:001;TYPE:STD'),'multiple_interments','multiple interments derive occupancy');
select extensions.lives_ok($$select pg_temp.persist('interment-summary',jsonb_build_array(pg_temp.import_row('001','Synthetic Beta','d')))$$,'logical duplicate with a different hash is skipped');
select extensions.is((select count(*)::integer from public.interments i join public.plots p on p.id=i.plot_id where p.normalized_lot_key='AREA:TEST;SECTOR:TEST;LOT:001;TYPE:STD'),2,'logical duplicate creates no interment');
select extensions.throws_ok($$select pg_temp.persist('interment-summary',jsonb_build_array(pg_temp.import_row('002','Synthetic Beta','e')))$$,'P0001','ambiguous_deceased_match','same name at another plot needs review');
select extensions.throws_ok($$select pg_temp.persist('interment-summary',jsonb_build_array(pg_temp.import_row('001','Synthetic Gamma','f')))$$,'P0001','capacity_review_required','configured capacity checked inside transaction');
select extensions.throws_ok($$select pg_temp.persist('inventory-list',jsonb_build_array(pg_temp.import_row('001',null,'f','HOLD')))$$,'P0001','existing_plot_conflict','plot metadata conflict is not overwritten');
select extensions.throws_ok($$select pg_temp.persist('inventory-list',jsonb_build_array(pg_temp.import_row('003',null,'1','BOOKED'),pg_temp.import_row('004',null,'2','HOLD') || '{"customer_name":"SYNTHETIC-PRIVATE-CANARY"}'::jsonb))$$,'P0001','unexpected_import_field','raw source field rejected transactionally');
select extensions.is((select count(*)::integer from public.plots where normalized_lot_key like 'AREA:TEST;SECTOR:TEST;LOT:00%'),1,'failed batch rolls back its earlier plot insert');
select extensions.is((select count(*)::integer from public.import_batches where status='running'),0,'failed transaction leaves no misleading running or completed batch');
select extensions.ok(not exists (select 1 from public.import_batches where validated_records::text like '%CANARY%'),'ledger does not contain excluded source data');
select extensions.ok(not exists (select 1 from public.import_batches, lateral jsonb_array_elements(validated_records) r where r ? 'display_name' or r ? 'raw_location'),'ledger uses allowlisted references, not entire rows');
select extensions.ok(not exists (select 1 from public.interments where source_reference like 'import-v1:%' and is_publicly_visible),'imported interments default private');
select extensions.throws_ok($$delete from public.import_batches where false$$,'42501',null,'Administrator cannot hard-delete batches');
select extensions.throws_ok($$delete from public.import_issues where false$$,'42501',null,'Administrator cannot hard-delete issues');
select extensions.throws_ok($$delete from public.interments where false$$,'42501',null,'Administrator cannot hard-delete interments');

select extensions.throws_ok($$select pg_temp.persist('inventory-list',jsonb_build_array(pg_temp.import_row('006',null,'6','BOOKED') || '{"raw_location":"DIFFERENT"}'::jsonb))$$,'P0001','unvalidated_import_record','raw location must agree with validated key');
select extensions.throws_ok($$select pg_temp.persist('interment-summary',jsonb_build_array(pg_temp.import_row('006','Synthetic Invalid Shape','6') || '{"birth":[]}'::jsonb))$$,'P0001','invalid_import_field_type','non-domain value shapes are rejected');
select extensions.throws_ok($$select public.persist_import_plan('00000000-0000-4000-8000-000000000001','inventory-list','synthetic','Inventory',jsonb_build_array(pg_temp.import_row('006',null,'6','BOOKED')),false)$$,'P0001','invalid_target_site','synthetic target cannot be mistaken for real data');
select extensions.throws_ok($$select pg_temp.persist('interment-summary',jsonb_build_array(pg_temp.import_row('006','Synthetic Invalid Date','6') || '{"birth":"01/02/2020"}'::jsonb))$$,'P0001','invalid_import_date','RPC also rejects ambiguous date syntax');
select extensions.lives_ok($$insert into public.plot_types(code,name,is_synthetic) values('EST','Synthetic estate configuration',true)$$,'estate requires explicit configuration');
select extensions.lives_ok($$select pg_temp.persist('inventory-list',jsonb_build_array(replace(pg_temp.import_row('007',null,'7','AVAILABLE')::text,'STD','EST')::jsonb))$$,'configured estate inference can persist');
select extensions.is((select count(*)::integer from public.import_issues where issue_code='estate_inference'),1,'estate inference warning is preserved in import issues');
select extensions.throws_ok(
  $$select public.persist_import_plan(
    '00000000-0000-4000-8000-000000000001',
    'inventory-list',
    'synthetic',
    'Inventory',
    (select jsonb_agg(pg_temp.import_row(lpad(value::text, 5, '0'), null, '8', 'AVAILABLE')) from generate_series(1, 10001) value),
    true
  )$$,
  'P0001',
  'invalid_import_plan',
  'persistence rejects batches above the 10,000-row default ceiling'
);

select * from extensions.finish();
rollback;
