alter table public.funnel_stages
  add column if not exists slug text;

update public.funnel_stages
set slug = case
  when name = 'Base' then 'base'
  when name = 'Lead Mapeado' then 'mapped_lead'
  when name = 'Tentando Contato' then 'trying_contact'
  when name = 'Conexão Iniciada' then 'connection_started'
  when name = 'Desqualificado' then 'disqualified'
  when name = 'Qualificado' then 'qualified'
  when name = 'Reunião Agendada' then 'meeting_scheduled'
  else coalesce(slug, lower(regexp_replace(name, '[^a-z0-9]+', '_', 'gi')))
end
where slug is null or btrim(slug) = '';

alter table public.funnel_stages
  alter column slug set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'funnel_stages_workspace_slug_unique'
  ) then
    alter table public.funnel_stages
      add constraint funnel_stages_workspace_slug_unique unique (workspace_id, slug);
  end if;
end $$;

create table if not exists public.outreach_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null,
  campaign_id uuid not null,
  message text not null,
  sent_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (lead_id, workspace_id)
    references public.leads (id, workspace_id)
    on delete cascade,
  foreign key (campaign_id, workspace_id)
    references public.campaigns (id, workspace_id)
    on delete cascade
);

create index if not exists idx_outreach_events_workspace_id
  on public.outreach_events (workspace_id);
create index if not exists idx_outreach_events_workspace_lead_id
  on public.outreach_events (workspace_id, lead_id);
create index if not exists idx_outreach_events_workspace_campaign_id
  on public.outreach_events (workspace_id, campaign_id);

alter table public.outreach_events enable row level security;

drop policy if exists outreach_events_select on public.outreach_events;
create policy outreach_events_select
on public.outreach_events
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists outreach_events_insert on public.outreach_events;
create policy outreach_events_insert
on public.outreach_events
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

drop policy if exists outreach_events_update on public.outreach_events;
create policy outreach_events_update
on public.outreach_events
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists outreach_events_delete on public.outreach_events;
create policy outreach_events_delete
on public.outreach_events
for delete
to authenticated
using (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on table public.outreach_events to authenticated;

create or replace function public.seed_default_funnel_stages_for_workspace(target_workspace_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.funnel_stages (workspace_id, name, slug, position, is_system)
  select
    target_workspace_id,
    seed.name,
    seed.slug,
    seed.position,
    true
  from (
    values
      ('Base', 'base', 1),
      ('Lead Mapeado', 'mapped_lead', 2),
      ('Tentando Contato', 'trying_contact', 3),
      ('Conexão Iniciada', 'connection_started', 4),
      ('Desqualificado', 'disqualified', 5),
      ('Qualificado', 'qualified', 6),
      ('Reunião Agendada', 'meeting_scheduled', 7)
  ) as seed(name, slug, position)
  where not exists (
    select 1
    from public.funnel_stages fs
    where fs.workspace_id = target_workspace_id
      and fs.slug = seed.slug
  );
$$;
