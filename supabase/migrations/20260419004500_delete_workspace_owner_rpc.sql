create or replace function public.delete_workspace_as_owner(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and wm.role = 'owner'
  ) then
    raise exception 'forbidden_workspace_owner_only' using errcode = 'P0001';
  end if;

  delete from public.workspaces
  where id = p_workspace_id;

  if not found then
    raise exception 'workspace_not_found' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.delete_workspace_as_owner(uuid) from public;
grant execute on function public.delete_workspace_as_owner(uuid) to authenticated;
