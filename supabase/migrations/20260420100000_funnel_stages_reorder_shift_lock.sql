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
  v_shift integer;
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

  perform 1
  from public.funnel_stages
  where workspace_id = p_workspace_id
  for update;

  select coalesce(max(position), 0) + 100000
  into v_shift
  from public.funnel_stages
  where workspace_id = p_workspace_id;

  update public.funnel_stages fs
  set position = v_shift + t.pos,
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
