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
  v_base_slug text;
  v_slug text;
  v_suffix integer;
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

  v_base_slug := lower(regexp_replace(v_name, '[^a-z0-9]+', '_', 'gi'));
  v_slug := v_base_slug;
  v_suffix := 0;
  while exists (
    select 1
    from public.funnel_stages
    where workspace_id = p_workspace_id
      and slug = v_slug
  ) loop
    v_suffix := v_suffix + 1;
    v_slug := v_base_slug || '_' || v_suffix::text;
  end loop;

  insert into public.funnel_stages (workspace_id, name, slug, position, is_system, updated_at)
  values (
    p_workspace_id,
    v_name,
    v_slug,
    v_next_position,
    false,
    now()
  )
  returning *
  into v_stage;

  return v_stage;
end;
$$;

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
  v_base_slug text;
  v_slug text;
  v_suffix integer;
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

  v_base_slug := lower(regexp_replace(v_name, '[^a-z0-9]+', '_', 'gi'));
  v_slug := v_base_slug;
  v_suffix := 0;
  while exists (
    select 1
    from public.funnel_stages
    where workspace_id = p_workspace_id
      and slug = v_slug
      and id <> p_stage_id
  ) loop
    v_suffix := v_suffix + 1;
    v_slug := v_base_slug || '_' || v_suffix::text;
  end loop;

  update public.funnel_stages
  set name = v_name,
      slug = v_slug,
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
  set position = -t.pos,
      updated_at = now()
  from (
    select u.id, u.pos
    from unnest(p_stage_ids) with ordinality as u(id, pos)
  ) t
  where fs.workspace_id = p_workspace_id
    and fs.id = t.id;

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
