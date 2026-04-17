create or replace function public.is_workspace_owner_or_admin(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = ws
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin')
  );
$$;

revoke all on function public.is_workspace_owner_or_admin(uuid) from public;
grant execute on function public.is_workspace_owner_or_admin(uuid) to authenticated;

create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  token text not null,
  expires_at timestamptz not null,
  invited_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  accepted_at timestamptz null,
  constraint workspace_invites_token_unique unique (token)
);

create unique index if not exists idx_workspace_invites_pending_workspace_email
  on public.workspace_invites (workspace_id, email)
  where accepted_at is null;

create index if not exists idx_workspace_invites_workspace_id
  on public.workspace_invites (workspace_id);

create index if not exists idx_workspace_invites_token_lookup
  on public.workspace_invites (token)
  where accepted_at is null;

create or replace function public.workspace_invites_normalize_email()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.email := lower(trim(new.email));
  return new;
end;
$$;

drop trigger if exists trg_workspace_invites_normalize_email on public.workspace_invites;
create trigger trg_workspace_invites_normalize_email
before insert or update on public.workspace_invites
for each row
execute function public.workspace_invites_normalize_email();

alter table public.workspace_invites enable row level security;

grant select, delete on public.workspace_invites to authenticated;

drop policy if exists "select workspace_members own rows" on public.workspace_members;
drop policy if exists "insert workspace_members as own owner row" on public.workspace_members;

create policy workspace_members_select_workspace
on public.workspace_members
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy workspace_members_insert_bootstrap_owner
on public.workspace_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'owner'
  and not exists (
    select 1
    from public.workspace_members wm0
    where wm0.workspace_id = workspace_members.workspace_id
  )
);

create policy workspace_members_update_admin
on public.workspace_members
for update
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id))
with check (public.is_workspace_owner_or_admin(workspace_id));

create policy workspace_members_delete_admin
on public.workspace_members
for delete
to authenticated
using (
  public.is_workspace_owner_or_admin(workspace_id)
  and (
    workspace_members.role <> 'owner'
    or exists (
      select 1
      from public.workspace_members wm2
      where wm2.workspace_id = workspace_members.workspace_id
        and wm2.role = 'owner'
        and wm2.user_id <> workspace_members.user_id
    )
  )
);

create policy workspace_invites_select_admin
on public.workspace_invites
for select
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id));

create policy workspace_invites_delete_admin
on public.workspace_invites
for delete
to authenticated
using (public.is_workspace_owner_or_admin(workspace_id));

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

create or replace function public.list_workspace_members_directory(p_workspace uuid)
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

  if not public.is_workspace_owner_or_admin(p_workspace) then
    raise exception 'list_workspace_members_directory_forbidden';
  end if;

  select coalesce(
    json_agg(
      json_build_object(
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

revoke all on function public.list_workspace_members_directory(uuid) from public;
grant execute on function public.list_workspace_members_directory(uuid) to authenticated;
