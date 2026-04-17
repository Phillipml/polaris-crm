create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null,
  type text not null
    check (type in ('stage_changed', 'fields_updated', 'outreach_sent')),
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (lead_id, workspace_id)
    references public.leads (id, workspace_id)
    on delete cascade
);

create index if not exists idx_lead_activities_workspace_lead_created
  on public.lead_activities (workspace_id, lead_id, created_at desc);

alter table public.lead_activities enable row level security;

drop policy if exists lead_activities_select on public.lead_activities;
create policy lead_activities_select
on public.lead_activities
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists lead_activities_insert on public.lead_activities;
create policy lead_activities_insert
on public.lead_activities
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

revoke all on table public.lead_activities from anon;
grant select, insert on table public.lead_activities to authenticated;

create or replace function public.leads_append_stage_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if old.stage_id is not distinct from new.stage_id then
    return new;
  end if;

  insert into public.lead_activities (workspace_id, lead_id, type, payload, created_by)
  values (
    new.workspace_id,
    new.id,
    'stage_changed',
    jsonb_build_object(
      'previous_stage_id', old.stage_id,
      'new_stage_id', new.stage_id
    ),
    auth.uid()
  );

  return new;
end;
$$;

drop trigger if exists trg_leads_stage_change_activity on public.leads;

create trigger trg_leads_stage_change_activity
after update on public.leads
for each row
execute function public.leads_append_stage_activity();
