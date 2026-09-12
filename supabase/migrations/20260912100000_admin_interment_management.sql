-- Task 5B: atomic Administrator interment mutations with conservative safety checks.

create function public.create_interment(
  p_deceased_person_id uuid,
  p_plot_id uuid,
  p_interment_date date,
  p_interment_type text,
  p_position_sequence integer,
  p_permanence_status text,
  p_confirm_occupied boolean default false
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_death_date date;
  v_capacity integer;
  v_active_count integer;
  v_interment_type text := nullif(regexp_replace(btrim(p_interment_type), '\s+', ' ', 'g'), '');
  v_permanence_status text := nullif(regexp_replace(btrim(p_permanence_status), '\s+', ' ', 'g'), '');
begin
  if not private.is_administrator() then
    raise exception 'administrator_required' using errcode = '42501';
  end if;
  if v_interment_type is not null and length(v_interment_type) > 100 then
    raise exception 'invalid_interment_type';
  end if;
  if p_position_sequence is not null and p_position_sequence < 1 then
    raise exception 'invalid_position_sequence';
  end if;
  if v_permanence_status is not null and length(v_permanence_status) > 100 then
    raise exception 'invalid_permanence_status';
  end if;

  select d.date_of_death into v_death_date
  from public.deceased_persons d
  where d.id = p_deceased_person_id and d.state = 'active';
  if not found then
    raise exception 'active_deceased_person_required';
  end if;

  select pt.regular_interment_capacity into v_capacity
  from public.plots p
  left join public.plot_types pt on pt.id = p.plot_type_id
  where p.id = p_plot_id and p.state = 'active'
  for update of p;
  if not found then
    raise exception 'active_plot_required';
  end if;

  if p_interment_date is not null and v_death_date is not null and p_interment_date < v_death_date then
    raise exception 'interment_before_death';
  end if;
  if exists (
    select 1 from public.interments i
    where i.deceased_person_id = p_deceased_person_id
      and i.plot_id = p_plot_id
      and i.interment_date is not distinct from p_interment_date
  ) then
    raise exception 'duplicate_interment';
  end if;

  select count(*)::integer into v_active_count
  from public.interments i
  where i.plot_id = p_plot_id and i.state = 'active';
  if v_active_count > 0 and v_capacity is null then
    raise exception 'plot_capacity_unknown';
  end if;
  if v_capacity is not null and v_active_count >= v_capacity then
    raise exception 'plot_capacity_reached';
  end if;
  if v_active_count > 0 and not p_confirm_occupied then
    raise exception 'occupied_plot_confirmation_required';
  end if;

  insert into public.interments (
    deceased_person_id, plot_id, interment_date, interment_type,
    position_sequence, permanence_status
  ) values (
    p_deceased_person_id, p_plot_id, p_interment_date, v_interment_type,
    p_position_sequence, v_permanence_status
  ) returning id into v_id;

  insert into public.audit_logs (actor_reference, action, entity_type, entity_id, changed_fields)
  values (
    auth.uid()::text,
    'interment.created',
    'interment',
    v_id,
    '["deceased_person_id", "plot_id", "interment_date", "interment_type", "position_sequence", "permanence_status"]'::jsonb
  );

  return v_id;
end;
$$;

create function public.update_interment(
  p_interment_id uuid,
  p_deceased_person_id uuid,
  p_plot_id uuid,
  p_interment_date date,
  p_interment_type text,
  p_position_sequence integer,
  p_permanence_status text,
  p_state public.record_state,
  p_confirm_occupied boolean default false
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_current public.interments%rowtype;
  v_death_date date;
  v_capacity integer;
  v_active_count integer;
  v_requires_capacity_check boolean;
  v_interment_type text := nullif(regexp_replace(btrim(p_interment_type), '\s+', ' ', 'g'), '');
  v_permanence_status text := nullif(regexp_replace(btrim(p_permanence_status), '\s+', ' ', 'g'), '');
  v_changed_fields jsonb := '[]'::jsonb;
begin
  if not private.is_administrator() then
    raise exception 'administrator_required' using errcode = '42501';
  end if;
  if v_interment_type is not null and length(v_interment_type) > 100 then
    raise exception 'invalid_interment_type';
  end if;
  if p_position_sequence is not null and p_position_sequence < 1 then
    raise exception 'invalid_position_sequence';
  end if;
  if v_permanence_status is not null and length(v_permanence_status) > 100 then
    raise exception 'invalid_permanence_status';
  end if;

  select * into v_current from public.interments where id = p_interment_id for update;
  if not found then
    raise exception 'interment_not_found' using errcode = 'P0002';
  end if;

  perform 1 from public.plots p
  where p.id in (v_current.plot_id, p_plot_id)
  order by p.id
  for update;

  select d.date_of_death into v_death_date
  from public.deceased_persons d
  where d.id = p_deceased_person_id;
  if not found then
    raise exception 'deceased_person_not_found';
  end if;

  select pt.regular_interment_capacity into v_capacity
  from public.plots p
  left join public.plot_types pt on pt.id = p.plot_type_id
  where p.id = p_plot_id
    and (p.state = 'active' or p.id = v_current.plot_id);
  if not found then
    raise exception 'active_plot_required';
  end if;

  if p_state = 'active' and not exists (
    select 1 from public.deceased_persons d
    where d.id = p_deceased_person_id and d.state = 'active'
  ) then
    raise exception 'active_deceased_person_required';
  end if;
  if p_interment_date is not null and v_death_date is not null and p_interment_date < v_death_date then
    raise exception 'interment_before_death';
  end if;
  if exists (
    select 1 from public.interments i
    where i.id <> p_interment_id
      and i.deceased_person_id = p_deceased_person_id
      and i.plot_id = p_plot_id
      and i.interment_date is not distinct from p_interment_date
  ) then
    raise exception 'duplicate_interment';
  end if;

  v_requires_capacity_check := p_state = 'active'
    and (v_current.state <> 'active' or v_current.plot_id <> p_plot_id);
  if v_requires_capacity_check then
    select count(*)::integer into v_active_count
    from public.interments i
    where i.plot_id = p_plot_id and i.state = 'active' and i.id <> p_interment_id;
    if v_active_count > 0 and v_capacity is null then
      raise exception 'plot_capacity_unknown';
    end if;
    if v_capacity is not null and v_active_count >= v_capacity then
      raise exception 'plot_capacity_reached';
    end if;
    if v_active_count > 0 and not p_confirm_occupied then
      raise exception 'occupied_plot_confirmation_required';
    end if;
  end if;

  if v_current.deceased_person_id is distinct from p_deceased_person_id then v_changed_fields := v_changed_fields || '"deceased_person_id"'::jsonb; end if;
  if v_current.plot_id is distinct from p_plot_id then v_changed_fields := v_changed_fields || '"plot_id"'::jsonb; end if;
  if v_current.interment_date is distinct from p_interment_date then v_changed_fields := v_changed_fields || '"interment_date"'::jsonb; end if;
  if v_current.interment_type is distinct from v_interment_type then v_changed_fields := v_changed_fields || '"interment_type"'::jsonb; end if;
  if v_current.position_sequence is distinct from p_position_sequence then v_changed_fields := v_changed_fields || '"position_sequence"'::jsonb; end if;
  if v_current.permanence_status is distinct from v_permanence_status then v_changed_fields := v_changed_fields || '"permanence_status"'::jsonb; end if;
  if v_current.state is distinct from p_state then v_changed_fields := v_changed_fields || '"state"'::jsonb; end if;

  if jsonb_array_length(v_changed_fields) > 0 then
    update public.interments set
      deceased_person_id = p_deceased_person_id,
      plot_id = p_plot_id,
      interment_date = p_interment_date,
      interment_type = v_interment_type,
      position_sequence = p_position_sequence,
      permanence_status = v_permanence_status,
      state = p_state,
      updated_at = now()
    where id = p_interment_id;

    insert into public.audit_logs (actor_reference, action, entity_type, entity_id, changed_fields)
    values (auth.uid()::text, 'interment.updated', 'interment', p_interment_id, v_changed_fields);
  end if;

  return p_interment_id;
end;
$$;

revoke all on function public.create_interment(uuid,uuid,date,text,integer,text,boolean) from public, anon;
revoke all on function public.update_interment(uuid,uuid,uuid,date,text,integer,text,public.record_state,boolean) from public, anon;
grant execute on function public.create_interment(uuid,uuid,date,text,integer,text,boolean) to authenticated;
grant execute on function public.update_interment(uuid,uuid,uuid,date,text,integer,text,public.record_state,boolean) to authenticated;
