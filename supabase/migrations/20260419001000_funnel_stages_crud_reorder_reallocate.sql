create or replace function public.create_funnel_stage(
  p_workspace_id uuid,
  p_name text
)
returns public.funnel_stages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_next_position integer;
  v_stage public.funnel_stages%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if not public.is_workspace_owner_or_admin(p_workspace_id) then
    raise exception 'forbidden_workspace' using errcode = 'P0001';
  end if;

  v_name := btrim(coalesce(p_name, ''));
  if v_name = '' then
    raise exception 'stage_name_required' using errcode = 'P0001';
  end if;

  select coalesce(max(position), 0) + 1
  into v_next_position
  from public.funnel_stages
  where workspace_id = p_workspace_id;

  insert into public.funnel_stages (workspace_id, name, slug, position, is_system, updated_at)
  values (
    p_workspace_id,
    v_name,
    lower(regexp_replace(v_name, '[^a-z0-9]+', '_', 'gi')),
    v_next_position,
    false,
    now()
  )
  returning *
  into v_stage;

  return v_stage;
end;
$$;

revoke all on function public.create_funnel_stage(uuid, text) from public;
grant execute on function public.create_funnel_stage(uuid, text) to authenticated;

create or replace function public.update_funnel_stage_name(
  p_workspace_id uuid,
  p_stage_id uuid,
  p_name text
)
returns public.funnel_stages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_stage public.funnel_stages%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if not public.is_workspace_owner_or_admin(p_workspace_id) then
    raise exception 'forbidden_workspace' using errcode = 'P0001';
  end if;

  v_name := btrim(coalesce(p_name, ''));
  if v_name = '' then
    raise exception 'stage_name_required' using errcode = 'P0001';
  end if;

  update public.funnel_stages
  set name = v_name,
      slug = lower(regexp_replace(v_name, '[^a-z0-9]+', '_', 'gi')),
      updated_at = now()
  where id = p_stage_id
    and workspace_id = p_workspace_id
  returning *
  into v_stage;

  if not found then
    raise exception 'stage_not_found' using errcode = 'P0001';
  end if;

  return v_stage;
end;
$$;

revoke all on function public.update_funnel_stage_name(uuid, uuid, text) from public;
grant execute on function public.update_funnel_stage_name(uuid, uuid, text) to authenticated;

create or replace function public.reorder_funnel_stages(
  p_workspace_id uuid,
  p_stage_ids uuid[]
)
returns setof public.funnel_stages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count_input integer;
  v_count_workspace integer;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if not public.is_workspace_owner_or_admin(p_workspace_id) then
    raise exception 'forbidden_workspace' using errcode = 'P0001';
  end if;

  v_count_input := coalesce(array_length(p_stage_ids, 1), 0);
  select count(*)
  into v_count_workspace
  from public.funnel_stages
  where workspace_id = p_workspace_id;

  if v_count_input = 0 or v_count_input <> v_count_workspace then
    raise exception 'invalid_stage_list' using errcode = 'P0001';
  end if;

  if (
    select count(*)
    from (
      select distinct x
      from unnest(p_stage_ids) as x
    ) d
  ) <> v_count_input then
    raise exception 'duplicate_stage_ids' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from unnest(p_stage_ids) as x
    left join public.funnel_stages fs
      on fs.id = x and fs.workspace_id = p_workspace_id
    where fs.id is null
  ) then
    raise exception 'invalid_stage_workspace' using errcode = 'P0001';
  end if;

  update public.funnel_stages fs
  set position = t.pos,
      updated_at = now()
  from (
    select u.id, u.pos
    from unnest(p_stage_ids) with ordinality as u(id, pos)
  ) t
  where fs.workspace_id = p_workspace_id
    and fs.id = t.id;

  return query
  select *
  from public.funnel_stages
  where workspace_id = p_workspace_id
  order by position asc;
end;
$$;

revoke all on function public.reorder_funnel_stages(uuid, uuid[]) from public;
grant execute on function public.reorder_funnel_stages(uuid, uuid[]) to authenticated;

create or replace function public.delete_funnel_stage(
  p_workspace_id uuid,
  p_stage_id uuid,
  p_reallocate_to_stage_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stage public.funnel_stages%rowtype;
  v_leads_count integer;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if not public.is_workspace_owner_or_admin(p_workspace_id) then
    raise exception 'forbidden_workspace' using errcode = 'P0001';
  end if;

  select *
  into v_stage
  from public.funnel_stages
  where id = p_stage_id
    and workspace_id = p_workspace_id
  for update;

  if not found then
    raise exception 'stage_not_found' using errcode = 'P0001';
  end if;

  if v_stage.is_system then
    raise exception 'system_stage_cannot_be_deleted' using errcode = 'P0001';
  end if;

  if (select count(*) from public.funnel_stages where workspace_id = p_workspace_id) <= 1 then
    raise exception 'cannot_delete_last_stage' using errcode = 'P0001';
  end if;

  select count(*)
  into v_leads_count
  from public.leads
  where workspace_id = p_workspace_id
    and stage_id = p_stage_id;

  if v_leads_count > 0 then
    if p_reallocate_to_stage_id is null then
      raise exception 'stage_has_leads_reallocation_required' using errcode = 'P0001';
    end if;

    if p_reallocate_to_stage_id = p_stage_id then
      raise exception 'invalid_reallocation_stage' using errcode = 'P0001';
    end if;

    if not exists (
      select 1
      from public.funnel_stages
      where id = p_reallocate_to_stage_id
        and workspace_id = p_workspace_id
    ) then
      raise exception 'reallocation_stage_not_found' using errcode = 'P0001';
    end if;

    update public.leads
    set stage_id = p_reallocate_to_stage_id,
        updated_at = now()
    where workspace_id = p_workspace_id
      and stage_id = p_stage_id;
  end if;

  delete from public.funnel_stages
  where id = p_stage_id
    and workspace_id = p_workspace_id;

  update public.funnel_stages fs
  set position = x.new_pos,
      updated_at = now()
  from (
    select id, row_number() over (order by position asc, created_at asc) as new_pos
    from public.funnel_stages
    where workspace_id = p_workspace_id
  ) x
  where fs.id = x.id
    and fs.workspace_id = p_workspace_id;
end;
$$;

revoke all on function public.delete_funnel_stage(uuid, uuid, uuid) from public;
grant execute on function public.delete_funnel_stage(uuid, uuid, uuid) to authenticated;
