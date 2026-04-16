create table if not exists public.lead_custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  key text not null,
  label text not null,
  type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, key),
  check (type in ('text', 'number', 'boolean', 'date', 'select'))
);

create index if not exists idx_lcfd_workspace_id
  on public.lead_custom_field_definitions (workspace_id);

alter table public.lead_custom_field_definitions enable row level security;

drop policy if exists lead_custom_field_definitions_select on public.lead_custom_field_definitions;
create policy lead_custom_field_definitions_select
on public.lead_custom_field_definitions
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists lead_custom_field_definitions_insert on public.lead_custom_field_definitions;
create policy lead_custom_field_definitions_insert
on public.lead_custom_field_definitions
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

drop policy if exists lead_custom_field_definitions_update on public.lead_custom_field_definitions;
create policy lead_custom_field_definitions_update
on public.lead_custom_field_definitions
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists lead_custom_field_definitions_delete on public.lead_custom_field_definitions;
create policy lead_custom_field_definitions_delete
on public.lead_custom_field_definitions
for delete
to authenticated
using (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on table public.lead_custom_field_definitions to authenticated;
