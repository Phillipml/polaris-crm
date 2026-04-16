do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'stage_required_field_kind'
      and n.nspname = 'public'
  ) then
    create type public.stage_required_field_kind as enum ('standard', 'custom');
  end if;
end $$;

create table if not exists public.stage_required_fields (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.funnel_stages(id) on delete cascade,
  field_key text not null,
  field_kind public.stage_required_field_kind not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stage_id, field_key, field_kind)
);

create index if not exists idx_stage_required_fields_stage_id
  on public.stage_required_fields (stage_id);

create index if not exists idx_stage_required_fields_field_kind
  on public.stage_required_fields (field_kind);

alter table public.stage_required_fields enable row level security;

drop policy if exists stage_required_fields_select on public.stage_required_fields;
create policy stage_required_fields_select
on public.stage_required_fields
for select
to authenticated
using (
  exists (
    select 1
    from public.funnel_stages fs
    where fs.id = stage_required_fields.stage_id
      and public.is_workspace_member(fs.workspace_id)
  )
);

drop policy if exists stage_required_fields_insert on public.stage_required_fields;
create policy stage_required_fields_insert
on public.stage_required_fields
for insert
to authenticated
with check (
  exists (
    select 1
    from public.funnel_stages fs
    where fs.id = stage_required_fields.stage_id
      and public.is_workspace_member(fs.workspace_id)
  )
);

drop policy if exists stage_required_fields_update on public.stage_required_fields;
create policy stage_required_fields_update
on public.stage_required_fields
for update
to authenticated
using (
  exists (
    select 1
    from public.funnel_stages fs
    where fs.id = stage_required_fields.stage_id
      and public.is_workspace_member(fs.workspace_id)
  )
)
with check (
  exists (
    select 1
    from public.funnel_stages fs
    where fs.id = stage_required_fields.stage_id
      and public.is_workspace_member(fs.workspace_id)
  )
);

drop policy if exists stage_required_fields_delete on public.stage_required_fields;
create policy stage_required_fields_delete
on public.stage_required_fields
for delete
to authenticated
using (
  exists (
    select 1
    from public.funnel_stages fs
    where fs.id = stage_required_fields.stage_id
      and public.is_workspace_member(fs.workspace_id)
  )
);

grant select, insert, update, delete on table public.stage_required_fields to authenticated;
