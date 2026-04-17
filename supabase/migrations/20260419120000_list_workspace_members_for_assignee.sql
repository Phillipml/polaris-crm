create or replace function public.list_workspace_members_for_assignee(p_workspace uuid)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  payload json;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if not public.is_workspace_member(p_workspace) then
    raise exception 'list_workspace_members_for_assignee_forbidden';
  end if;

  select coalesce(
    json_agg(
      json_build_object(
        'workspace_id', wm.workspace_id,
        'user_id', wm.user_id,
        'email', u.email,
        'role', wm.role,
        'created_at', wm.created_at
      )
      order by wm.created_at asc
    ),
    '[]'::json
  )
  into payload
  from public.workspace_members wm
  join auth.users u on u.id = wm.user_id
  where wm.workspace_id = p_workspace;

  return payload;
end;
$$;

revoke all on function public.list_workspace_members_for_assignee(uuid) from public;
grant execute on function public.list_workspace_members_for_assignee(uuid) to authenticated;
