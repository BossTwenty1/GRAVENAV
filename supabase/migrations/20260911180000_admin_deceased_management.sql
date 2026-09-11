-- Task 5A: atomic administrator deceased-person mutations with append-only audit history.

create function public.create_deceased_person(
  p_source_display_name text,
  p_date_of_birth date,
  p_date_of_death date
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_name text := regexp_replace(btrim(p_source_display_name), '\s+', ' ', 'g');
begin
  if not private.is_administrator() then
    raise exception 'administrator_required' using errcode = '42501';
  end if;
  if v_name is null or v_name = '' or length(v_name) > 200 then
    raise exception 'invalid_deceased_name';
  end if;
  if p_date_of_birth is not null and p_date_of_death is not null and p_date_of_birth > p_date_of_death then
    raise exception 'invalid_deceased_date_order';
  end if;

  insert into public.deceased_persons (source_display_name, date_of_birth, date_of_death)
  values (v_name, p_date_of_birth, p_date_of_death)
  returning id into v_id;

  insert into public.audit_logs (actor_reference, action, entity_type, entity_id, changed_fields)
  values (
    auth.uid()::text,
    'deceased_person.created',
    'deceased_person',
    v_id,
    '["source_display_name", "date_of_birth", "date_of_death"]'::jsonb
  );

  return v_id;
end;
$$;

create function public.update_deceased_person(
  p_deceased_person_id uuid,
  p_source_display_name text,
  p_date_of_birth date,
  p_date_of_death date
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_current public.deceased_persons%rowtype;
  v_name text := regexp_replace(btrim(p_source_display_name), '\s+', ' ', 'g');
  v_changed_fields jsonb := '[]'::jsonb;
begin
  if not private.is_administrator() then
    raise exception 'administrator_required' using errcode = '42501';
  end if;
  if v_name is null or v_name = '' or length(v_name) > 200 then
    raise exception 'invalid_deceased_name';
  end if;
  if p_date_of_birth is not null and p_date_of_death is not null and p_date_of_birth > p_date_of_death then
    raise exception 'invalid_deceased_date_order';
  end if;

  select * into v_current
  from public.deceased_persons
  where id = p_deceased_person_id
  for update;

  if not found then
    raise exception 'deceased_person_not_found' using errcode = 'P0002';
  end if;

  if v_current.source_display_name is distinct from v_name then
    v_changed_fields := v_changed_fields || '"source_display_name"'::jsonb;
  end if;
  if v_current.date_of_birth is distinct from p_date_of_birth then
    v_changed_fields := v_changed_fields || '"date_of_birth"'::jsonb;
  end if;
  if v_current.date_of_death is distinct from p_date_of_death then
    v_changed_fields := v_changed_fields || '"date_of_death"'::jsonb;
  end if;

  if jsonb_array_length(v_changed_fields) > 0 then
    update public.deceased_persons
    set source_display_name = v_name,
        date_of_birth = p_date_of_birth,
        date_of_death = p_date_of_death,
        updated_at = now()
    where id = p_deceased_person_id;

    insert into public.audit_logs (actor_reference, action, entity_type, entity_id, changed_fields)
    values (
      auth.uid()::text,
      'deceased_person.updated',
      'deceased_person',
      p_deceased_person_id,
      v_changed_fields
    );
  end if;

  return p_deceased_person_id;
end;
$$;

revoke all on function public.create_deceased_person(text,date,date) from public, anon;
revoke all on function public.update_deceased_person(uuid,text,date,date) from public, anon;
grant execute on function public.create_deceased_person(text,date,date) to authenticated;
grant execute on function public.update_deceased_person(uuid,text,date,date) to authenticated;
