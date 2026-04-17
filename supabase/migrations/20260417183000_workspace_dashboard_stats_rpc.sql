create or replace function public.workspace_dashboard_stats(p_workspace uuid)
returns table (
  total_leads bigint,
  stage_counts jsonb,
  suggestions_last_7d bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace
      and wm.user_id = v_uid
  ) then
    raise exception 'forbidden_workspace' using errcode = '42501';
  end if;

  return query
  with lead_rows as (
    select l.stage_id
    from public.leads l
    where l.workspace_id = p_workspace
  ),
  stage_rows as (
    select lr.stage_id::text as stage_id, count(*)::bigint as total
    from lead_rows lr
    group by lr.stage_id
  )
  select
    (select count(*)::bigint from lead_rows) as total_leads,
    coalesce(
      (select jsonb_object_agg(sr.stage_id, sr.total) from stage_rows sr),
      '{}'::jsonb
    ) as stage_counts,
    (
      select count(*)::bigint
      from public.lead_message_suggestions lms
      where lms.workspace_id = p_workspace
        and lms.created_at >= now() - interval '7 days'
    ) as suggestions_last_7d;
end;
$$;

revoke all on function public.workspace_dashboard_stats(uuid) from public;
grant execute on function public.workspace_dashboard_stats(uuid) to authenticated;
