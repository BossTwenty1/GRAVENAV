begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

insert into auth.users (id, email) values
  ('50000000-0000-4000-8000-000000000001', 'task5a-admin@example.invalid'),
  ('50000000-0000-4000-8000-000000000002', 'task5a-nonadmin@example.invalid');
insert into public.user_profiles (id, application_role, display_name, is_active) values
  ('50000000-0000-4000-8000-000000000001', 'administrator', '[TEST ONLY] Task 5A administrator', true);

set local role anon;
select extensions.throws_ok(
  $$select public.create_deceased_person('Synthetic Anonymous', null, null)$$,
  '42501',
  null,
  'anonymous users cannot execute the deceased create function'
);
select extensions.throws_ok(
  $$select * from public.deceased_persons$$,
  '42501',
  null,
  'anonymous deceased-record denial remains intact'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000002', true);
select extensions.throws_ok(
  $$select public.create_deceased_person('Synthetic Nonadmin', null, null)$$,
  '42501',
  'administrator_required',
  'an authenticated non-administrator cannot create a deceased record'
);

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', true);
select extensions.lives_ok(
  $$select public.create_deceased_person('  Synthetic   Created Person  ', null, null)$$,
  'an Administrator can create a deceased record without optional dates'
);
select extensions.results_eq(
  $$select display_name, date_of_birth, date_of_death from public.deceased_persons where source_display_name = 'Synthetic Created Person'$$,
  $$values ('Synthetic Created Person'::text, null::date, null::date)$$,
  'creation normalizes whitespace and preserves missing dates'
);
select extensions.is(
  (select count(*)::integer from public.deceased_persons where normalized_search_name ilike '%created person%'),
  1,
  'generated normalized names support case-insensitive database search'
);
select extensions.is(
  (select count(*)::integer from public.audit_logs where action = 'deceased_person.created' and entity_id = (select id from public.deceased_persons where source_display_name = 'Synthetic Created Person')),
  1,
  'creation appends one audit event in the same function'
);
select extensions.ok(
  (select before_data is null and after_data is null and actor_reference = '50000000-0000-4000-8000-000000000001' from public.audit_logs where action = 'deceased_person.created' limit 1),
  'the create audit event has an actor but no sensitive payload snapshot'
);
select extensions.throws_ok(
  $$select public.create_deceased_person('Synthetic Reversed Dates', '2020-01-02', '2020-01-01')$$,
  'P0001',
  'invalid_deceased_date_order',
  'the database mutation rejects birth after death'
);

select extensions.lives_ok(
  $$select public.update_deceased_person((select id from public.deceased_persons where source_display_name = 'Synthetic Created Person'), 'Synthetic Corrected Person', '1940-01-01', '2020-01-01')$$,
  'an Administrator can correct the same deceased record'
);
select extensions.results_eq(
  $$select source_display_name, date_of_birth, date_of_death from public.deceased_persons where source_display_name = 'Synthetic Corrected Person'$$,
  $$values ('Synthetic Corrected Person'::text, '1940-01-01'::date, '2020-01-01'::date)$$,
  'the correction updates only the managed values'
);
select extensions.is(
  (select count(*)::integer from public.audit_logs where action = 'deceased_person.updated' and entity_id = (select id from public.deceased_persons where source_display_name = 'Synthetic Corrected Person')),
  1,
  'correction appends one audit event'
);
select extensions.results_eq(
  $$select changed_fields from public.audit_logs where action = 'deceased_person.updated' limit 1$$,
  $$values ('["source_display_name", "date_of_birth", "date_of_death"]'::jsonb)$$,
  'the update audit event records field names without raw before or after data'
);
select extensions.lives_ok(
  $$select public.update_deceased_person((select id from public.deceased_persons where source_display_name = 'Synthetic Corrected Person'), 'Synthetic Corrected Person', '1940-01-01', '2020-01-01')$$,
  'saving unchanged values is safe'
);
select extensions.is(
  (select count(*)::integer from public.audit_logs where action = 'deceased_person.updated'),
  1,
  'an unchanged save does not create misleading audit history'
);
select extensions.throws_ok(
  $$delete from public.deceased_persons where source_display_name = 'Synthetic Corrected Person'$$,
  '42501',
  null,
  'Task 5A does not add hard-delete capability'
);

reset role;
select extensions.ok(
  not has_table_privilege('authenticated', 'public.deceased_persons', 'delete'),
  'authenticated retains no deceased-person DELETE grant'
);
select extensions.is(
  (select count(*)::integer from pg_proc join pg_namespace on pg_namespace.oid = pg_proc.pronamespace where nspname = 'public' and proname like '%deceased%delete%'),
  0,
  'no deceased-record delete function exists'
);

select * from extensions.finish();
rollback;
