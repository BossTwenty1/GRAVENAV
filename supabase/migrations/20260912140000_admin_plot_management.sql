-- Task 5C: atomic Administrator plot creation and correction.

create function public.create_plot(
  p_cemetery_site_id uuid,
  p_cemetery_area_id uuid,
  p_sector_id uuid,
  p_plot_identifier text,
  p_plot_type_id uuid
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_identifier text := regexp_replace(btrim(p_plot_identifier), '\s+', ' ', 'g');
  v_lot_key text := lower(regexp_replace(btrim(p_plot_identifier), '\s+', ' ', 'g'));
begin
  if not private.is_administrator() then
    raise exception 'administrator_required' using errcode = '42501';
  end if;
  if v_identifier is null or v_identifier = '' or length(v_identifier) > 100 then
    raise exception 'invalid_plot_identifier';
  end if;

  perform 1
  from public.cemetery_sites cs
  join public.cemetery_areas ca on ca.cemetery_site_id = cs.id
  join public.sectors s on s.cemetery_area_id = ca.id
  where cs.id = p_cemetery_site_id
    and ca.id = p_cemetery_area_id
    and s.id = p_sector_id
    and cs.is_active and ca.is_active and s.is_active;
  if not found then
    raise exception 'invalid_plot_hierarchy';
  end if;

  perform 1 from public.plot_types pt where pt.id = p_plot_type_id and pt.is_active;
  if not found then
    raise exception 'active_plot_type_required';
  end if;

  if exists (
    select 1 from public.plots p
    where p.cemetery_site_id = p_cemetery_site_id
      and p.normalized_lot_key = v_lot_key
  ) then
    raise exception 'duplicate_plot';
  end if;

  insert into public.plots (
    cemetery_site_id,
    cemetery_area_id,
    sector_id,
    normalized_plot_identifier,
    normalized_lot_key,
    plot_type_id
  ) values (
    p_cemetery_site_id,
    p_cemetery_area_id,
    p_sector_id,
    v_identifier,
    v_lot_key,
    p_plot_type_id
  ) returning id into v_id;

  insert into public.audit_logs (actor_reference, action, entity_type, entity_id, changed_fields)
  values (
    auth.uid()::text,
    'plot.created',
    'plot',
    v_id,
    '["cemetery_site_id", "cemetery_area_id", "sector_id", "normalized_plot_identifier", "normalized_lot_key", "plot_type_id"]'::jsonb
  );

  return v_id;
exception
  when unique_violation then
    raise exception 'duplicate_plot';
end;
$$;

create function public.update_plot(
  p_plot_id uuid,
  p_cemetery_site_id uuid,
  p_cemetery_area_id uuid,
  p_sector_id uuid,
  p_plot_identifier text,
  p_plot_type_id uuid,
  p_state public.record_state,
  p_confirm_occupied_location_change boolean default false
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_current public.plots%rowtype;
  v_identifier text := regexp_replace(btrim(p_plot_identifier), '\s+', ' ', 'g');
  v_lot_key text := lower(regexp_replace(btrim(p_plot_identifier), '\s+', ' ', 'g'));
  v_capacity integer;
  v_active_count integer;
  v_location_changed boolean;
  v_changed_fields jsonb := '[]'::jsonb;
begin
  if not private.is_administrator() then
    raise exception 'administrator_required' using errcode = '42501';
  end if;
  if v_identifier is null or v_identifier = '' or length(v_identifier) > 100 then
    raise exception 'invalid_plot_identifier';
  end if;

  select * into v_current from public.plots where id = p_plot_id for update;
  if not found then
    raise exception 'plot_not_found' using errcode = 'P0002';
  end if;

  perform 1
  from public.cemetery_sites cs
  join public.cemetery_areas ca on ca.cemetery_site_id = cs.id
  join public.sectors s on s.cemetery_area_id = ca.id
  where cs.id = p_cemetery_site_id
    and ca.id = p_cemetery_area_id
    and s.id = p_sector_id
    and cs.is_active and ca.is_active and s.is_active;
  if not found then
    raise exception 'invalid_plot_hierarchy';
  end if;

  select pt.regular_interment_capacity into v_capacity
  from public.plot_types pt
  where pt.id = p_plot_type_id and pt.is_active;
  if not found then
    raise exception 'active_plot_type_required';
  end if;

  if exists (
    select 1 from public.plots p
    where p.id <> p_plot_id
      and p.cemetery_site_id = p_cemetery_site_id
      and p.normalized_lot_key = v_lot_key
  ) then
    raise exception 'duplicate_plot';
  end if;

  select count(*)::integer into v_active_count
  from public.interments i
  where i.plot_id = p_plot_id and i.state = 'active';

  if v_current.plot_type_id is distinct from p_plot_type_id then
    if v_capacity is not null and v_capacity < v_active_count then
      raise exception 'plot_type_capacity_below_active_count';
    end if;
    if v_capacity is null and v_active_count > 1 then
      raise exception 'plot_type_capacity_unknown_for_multiple';
    end if;
  end if;

  if p_state = 'archived' and v_active_count > 0 then
    raise exception 'active_interments_prevent_plot_archive';
  end if;

  v_location_changed := v_current.cemetery_site_id is distinct from p_cemetery_site_id
    or v_current.cemetery_area_id is distinct from p_cemetery_area_id
    or v_current.sector_id is distinct from p_sector_id
    or v_current.normalized_lot_key is distinct from v_lot_key;
  if v_location_changed and v_active_count > 0 and not p_confirm_occupied_location_change then
    raise exception 'occupied_plot_location_confirmation_required';
  end if;

  if v_current.cemetery_site_id is distinct from p_cemetery_site_id then v_changed_fields := v_changed_fields || '"cemetery_site_id"'::jsonb; end if;
  if v_current.cemetery_area_id is distinct from p_cemetery_area_id then v_changed_fields := v_changed_fields || '"cemetery_area_id"'::jsonb; end if;
  if v_current.sector_id is distinct from p_sector_id then v_changed_fields := v_changed_fields || '"sector_id"'::jsonb; end if;
  if v_current.normalized_plot_identifier is distinct from v_identifier then v_changed_fields := v_changed_fields || '"normalized_plot_identifier"'::jsonb; end if;
  if v_current.normalized_lot_key is distinct from v_lot_key then v_changed_fields := v_changed_fields || '"normalized_lot_key"'::jsonb; end if;
  if v_current.plot_type_id is distinct from p_plot_type_id then v_changed_fields := v_changed_fields || '"plot_type_id"'::jsonb; end if;
  if v_current.state is distinct from p_state then v_changed_fields := v_changed_fields || '"state"'::jsonb; end if;

  if jsonb_array_length(v_changed_fields) > 0 then
    update public.plots set
      cemetery_site_id = p_cemetery_site_id,
      cemetery_area_id = p_cemetery_area_id,
      sector_id = p_sector_id,
      normalized_plot_identifier = v_identifier,
      normalized_lot_key = v_lot_key,
      plot_type_id = p_plot_type_id,
      state = p_state,
      updated_at = now()
    where id = p_plot_id;

    insert into public.audit_logs (actor_reference, action, entity_type, entity_id, changed_fields)
    values (auth.uid()::text, 'plot.updated', 'plot', p_plot_id, v_changed_fields);
  end if;

  return p_plot_id;
exception
  when unique_violation then
    raise exception 'duplicate_plot';
end;
$$;

revoke all on function public.create_plot(uuid,uuid,uuid,text,uuid) from public, anon;
revoke all on function public.update_plot(uuid,uuid,uuid,uuid,text,uuid,public.record_state,boolean) from public, anon;
grant execute on function public.create_plot(uuid,uuid,uuid,text,uuid) to authenticated;
grant execute on function public.update_plot(uuid,uuid,uuid,uuid,text,uuid,public.record_state,boolean) to authenticated;
