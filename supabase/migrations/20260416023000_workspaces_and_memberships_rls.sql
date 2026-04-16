create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

create policy "insert workspace as authenticated"
on public.workspaces
for insert
to authenticated
with check (auth.uid() is not null);

create policy "select workspace_members own rows"
on public.workspace_members
for select
to authenticated
using (user_id = auth.uid());

create policy "insert workspace_members as own owner row"
on public.workspace_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'owner'
  and not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspace_members.workspace_id
  )
);

create function public.create_workspace_with_owner(workspace_name text)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_workspace_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if workspace_name is null or length(trim(workspace_name)) = 0 then
    raise exception 'workspace_name is required';
  end if;

  insert into public.workspaces (name)
  values (trim(workspace_name))
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, auth.uid(), 'owner');

  return new_workspace_id;
end;
$$;

grant execute on function public.create_workspace_with_owner(text) to authenticated;
