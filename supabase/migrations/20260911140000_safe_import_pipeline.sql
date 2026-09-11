-- Task 4: preserve undecomposed names and sanitized per-row import provenance.
-- PostgreSQL 15 cannot replace a generated expression in place.
alter table public.deceased_persons add column source_display_name text;
alter table public.deceased_persons drop column display_name;
alter table public.deceased_persons drop column normalized_search_name;
alter table public.deceased_persons add column display_name text generated always as (
  coalesce(source_display_name, public.person_display_name(given_name, middle_name, family_name, suffix))
) stored;
alter table public.deceased_persons add column normalized_search_name text generated always as (
  lower(regexp_replace(btrim(coalesce(source_display_name,
    public.person_display_name(given_name, middle_name, family_name, suffix))), '\s+', ' ', 'g'))
) stored;
alter table public.deceased_persons add constraint deceased_display_name_present check (btrim(display_name) <> '');
create index deceased_persons_normalized_name_idx on public.deceased_persons (normalized_search_name);

alter table public.import_batches add column validated_records jsonb not null default '[]'::jsonb
  check (jsonb_typeof(validated_records) = 'array');
comment on column public.import_batches.validated_records is
  'Internal allowlisted import ledger, not raw spreadsheet rows. Includes safe row references, fingerprints, normalized keys, validation states and resulting entity IDs.';
create index import_batches_validated_records_idx on public.import_batches using gin (validated_records jsonb_path_ops);
create unique index interments_import_fingerprint_unique on public.interments (source_reference)
  where source_reference like 'import-v1:%';

-- Invoker security retains the existing Administrator RLS and grants.
-- The RPC is deliberately not a Server Action/public upload endpoint.
create function public.persist_import_plan(
  p_site_id uuid, p_adapter text, p_label text, p_sheet text,
  p_records jsonb, p_synthetic boolean default false
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_batch uuid;
  v_row jsonb;
  v_plot public.plots%rowtype;
  v_type uuid;
  v_person uuid;
  v_interment uuid;
  v_key text;
  v_name text;
  v_class text;
  v_status text;
  v_fingerprint text;
  v_ledger jsonb := '[]'::jsonb;
  v_imported integer := 0;
  v_capacity integer;
  v_date text;
begin
  if not private.is_administrator() then raise exception 'administrator_required' using errcode = '42501'; end if;
  if p_adapter is null or p_adapter not in ('inventory-list', 'interment-summary')
    or p_label is null or p_label !~ '^[A-Za-z0-9 _.-]{1,80}$'
    or p_sheet is null or length(p_sheet) not between 1 and 80
    or p_records is null or jsonb_typeof(p_records) <> 'array'
    or jsonb_array_length(p_records) not between 1 and 10000
    or pg_column_size(p_records) > 10485760
  then raise exception 'invalid_import_plan'; end if;
  if (p_adapter = 'inventory-list' and lower(regexp_replace(btrim(p_sheet), '\s+', ' ', 'g')) not in ('inventory','inventory list','synthetic inventory'))
    or (p_adapter = 'interment-summary' and lower(regexp_replace(btrim(p_sheet), '\s+', ' ', 'g')) not in ('interment summary','synthetic interments'))
  then raise exception 'unapproved_worksheet'; end if;
  if not exists (select 1 from public.cemetery_sites where id = p_site_id and is_active and is_synthetic = p_synthetic)
  then raise exception 'invalid_target_site'; end if;
  -- Serialize import writers. The unique plot/fingerprint constraints also
  -- protect against competing inserts outside this function.
  perform pg_advisory_xact_lock(71404, 1);
  insert into public.import_batches (source_label, source_sheet, import_type, status, started_at, records_seen)
    values (p_label, p_sheet, p_adapter, 'running', now(), jsonb_array_length(p_records)) returning id into v_batch;
  for v_row in select value from jsonb_array_elements(p_records) loop
    if jsonb_typeof(v_row) <> 'object' or exists (
      select 1 from jsonb_object_keys(v_row) k where k not in
      ('row','state','fingerprint','key','raw_location','classification','commercial_status','display_name','birth','death','interment')
    ) then raise exception 'unexpected_import_field'; end if;
    if jsonb_typeof(v_row->'row') is distinct from 'number' or exists (
      select 1 from jsonb_each(v_row) e where e.key <> 'row' and jsonb_typeof(e.value) not in ('string','null')
    ) then raise exception 'invalid_import_field_type'; end if;
    v_key := v_row->>'key'; v_name := v_row->>'display_name';
    v_class := v_row->>'classification'; v_status := v_row->>'commercial_status';
    v_fingerprint := v_row->>'fingerprint';
    if (v_row->>'state') is null or (v_row->>'state') not in ('valid','valid_with_warnings')
      or v_key is null or v_key !~ '^AREA:[A-Z0-9-]+;SECTOR:[A-Z0-9-]+;LOT:[0-9]+[A-Z]?(;UNIT:[A-Z0-9-]+)?;TYPE:(STD|PRM|SPR|EST)$'
      or v_class is distinct from substring(v_key from 'TYPE:([A-Z]+)$')
      or v_fingerprint is null or v_fingerprint !~ '^[a-f0-9]{64}$'
      or coalesce((v_row->>'row')::integer, 0) not between 2 and 10001
      or coalesce(length(v_row->>'raw_location'), 0) not between 1 and 512
      or v_key is distinct from regexp_replace(translate(upper(regexp_replace(btrim(v_row->>'raw_location'), '\s+', ' ', 'g')), '‐‑‒–—―−', '-------'), '\s*([:;/])\s*', '\1', 'g')
      or (v_status is not null and v_status not in ('BOOKED','AVAILABLE','HOLD'))
    then raise exception 'unvalidated_import_record'; end if;
    if p_adapter = 'inventory-list' and (v_name is not null or v_row->>'birth' is not null or v_row->>'death' is not null or v_row->>'interment' is not null)
    then raise exception 'unexpected_interment_fields'; end if;
    if p_adapter = 'interment-summary' and (coalesce(length(btrim(v_name)), 0) not between 1 and 512 or v_status is not null)
    then raise exception 'invalid_interment_record'; end if;
    foreach v_date in array array[v_row->>'birth', v_row->>'death', v_row->>'interment'] loop
      if v_date is not null and (v_date !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or v_date::date::text <> v_date)
      then raise exception 'invalid_import_date'; end if;
    end loop;
    if (v_row->>'birth')::date > (v_row->>'death')::date
      or (v_row->>'death')::date > (v_row->>'interment')::date
      or (v_row->>'birth')::date > (v_row->>'interment')::date
    then raise exception 'suspicious_date_sequence'; end if;

    if exists (select 1 from public.import_batches where status = 'completed'
      and validated_records @> jsonb_build_array(jsonb_build_object('fingerprint', v_fingerprint)))
    then continue; end if;
    -- Same-batch duplicates are independently rejected/skipped here too.
    if v_ledger @> jsonb_build_array(jsonb_build_object('fingerprint', v_fingerprint)) then continue; end if;

    select * into v_plot from public.plots where cemetery_site_id = p_site_id and normalized_lot_key = v_key for update;
    if exists (select 1 from public.plots where cemetery_site_id = p_site_id and normalized_lot_key <> v_key
      and regexp_replace(normalized_lot_key, ';TYPE:[A-Z]+$', '') = regexp_replace(v_key, ';TYPE:[A-Z]+$', ''))
    then raise exception 'ambiguous_plot_match'; end if;
    select id, regular_interment_capacity into v_type, v_capacity from public.plot_types where code = v_class and is_active;
    if not found then raise exception 'plot_type_configuration_required'; end if;
    if v_plot.id is null then
      insert into public.plots (cemetery_site_id, normalized_plot_identifier, raw_lot_location, normalized_lot_key, plot_type_id, source_commercial_status, is_synthetic)
      values (p_site_id, v_key, v_row->>'raw_location', v_key, v_type, v_status, p_synthetic) returning * into v_plot;
    elsif v_plot.state <> 'active' or v_plot.is_synthetic <> p_synthetic or v_plot.plot_type_id is distinct from v_type
      or (v_status is not null and v_plot.source_commercial_status is distinct from v_status)
    then raise exception 'existing_plot_conflict'; end if;
    v_person := null; v_interment := null;
    if p_adapter = 'interment-summary' then
      -- Existing exact logical interment: skip independently of caller hash.
      select i.id, d.id into v_interment, v_person from public.interments i
      join public.deceased_persons d on d.id = i.deceased_person_id
      where i.plot_id = v_plot.id
        and d.normalized_search_name = lower(regexp_replace(btrim(v_name), '\s+', ' ', 'g'))
        and d.date_of_birth is not distinct from (v_row->>'birth')::date
        and d.date_of_death is not distinct from (v_row->>'death')::date
        and i.interment_date is not distinct from (v_row->>'interment')::date limit 1;
      if v_interment is not null then continue; end if;
      if exists (select 1 from public.deceased_persons d
        where d.normalized_search_name = lower(regexp_replace(btrim(v_name), '\s+', ' ', 'g'))
        and (d.date_of_birth is null or v_row->>'birth' is null or d.date_of_birth = (v_row->>'birth')::date)
        and (d.date_of_death is null or v_row->>'death' is null or d.date_of_death = (v_row->>'death')::date))
      then raise exception 'ambiguous_deceased_match'; end if;
      if v_capacity is not null and (select count(*) from public.interments where plot_id = v_plot.id and state = 'active') >= v_capacity
      then raise exception 'capacity_review_required'; end if;
      insert into public.deceased_persons (source_display_name, date_of_birth, date_of_death, is_synthetic)
      values (v_name, (v_row->>'birth')::date, (v_row->>'death')::date, p_synthetic) returning id into v_person;
      insert into public.interments (deceased_person_id, plot_id, interment_date, import_batch_id, source_reference, is_synthetic, is_publicly_visible)
      values (v_person, v_plot.id, (v_row->>'interment')::date, v_batch, 'import-v1:' || v_fingerprint, p_synthetic, false) returning id into v_interment;
    end if;
    if v_class = 'EST' then
      insert into public.import_issues (import_batch_id, source_row_reference, issue_code, severity, field_name, description)
      values (v_batch, v_row->>'row', 'estate_inference', 'warning', 'classification', 'EST to estate is a project inference; review before real migration.');
    end if;
    v_ledger := v_ledger || jsonb_build_array(jsonb_build_object(
      'row', (v_row->>'row')::integer, 'fingerprint', v_fingerprint,
      'normalized_lot_key', v_key, 'validation_state', v_row->>'state',
      'plot_id', v_plot.id, 'deceased_person_id', v_person, 'interment_id', v_interment));
    v_imported := v_imported + 1;
  end loop;
  update public.import_batches set status = 'completed', completed_at = now(), records_imported = v_imported,
    records_rejected = 0, validated_records = v_ledger where id = v_batch;
  return v_batch;
end;
$$;
revoke all on function public.persist_import_plan(uuid,text,text,text,jsonb,boolean) from public, anon;
grant execute on function public.persist_import_plan(uuid,text,text,text,jsonb,boolean) to authenticated;
