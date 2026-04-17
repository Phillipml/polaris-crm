create or replace function public.create_workspace_invite(
  p_workspace_id uuid,
  p_email text,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_norm_email text;
  v_token text;
  v_id uuid;
  v_expires timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if not public.is_workspace_owner_or_admin(p_workspace_id) then
    raise exception 'create_workspace_invite_forbidden';
  end if;

  v_norm_email := lower(trim(coalesce(p_email, '')));
  if length(v_norm_email) = 0 then
    raise exception 'create_workspace_invite_email_required';
  end if;

  if p_role is null or p_role not in ('admin', 'member') then
    raise exception 'create_workspace_invite_invalid_role';
  end if;

  if exists (
    select 1
    from public.workspace_members wm
    join auth.users u on u.id = wm.user_id
    where wm.workspace_id = p_workspace_id
      and lower(u.email) = v_norm_email
  ) then
    raise exception 'create_workspace_invite_already_member';
  end if;

  delete from public.workspace_invites wi
  where wi.workspace_id = p_workspace_id
    and wi.email = v_norm_email
    and wi.accepted_at is null;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_expires := now() + interval '14 days';

  insert into public.workspace_invites (
    workspace_id,
    email,
    role,
    token,
    expires_at,
    invited_by
  )
  values (
    p_workspace_id,
    v_norm_email,
    p_role,
    v_token,
    v_expires,
    auth.uid()
  )
  returning id, token, expires_at into v_id, v_token, v_expires;

  return jsonb_build_object(
    'id', v_id,
    'token', v_token,
    'expires_at', v_expires
  );
end;
$$;

revoke all on function public.create_workspace_invite(uuid, text, text) from public;
grant execute on function public.create_workspace_invite(uuid, text, text) to authenticated;
