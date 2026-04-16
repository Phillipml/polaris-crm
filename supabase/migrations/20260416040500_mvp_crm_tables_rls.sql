create extension if not exists pgcrypto;

create function public.is_workspace_member(ws uuid)
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
  );
$$;

create table if not exists public.funnel_stages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  position integer not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name),
  unique (workspace_id, position),
  unique (id, workspace_id)
);

create index if not exists idx_funnel_stages_workspace_id on public.funnel_stages (workspace_id);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  stage_id uuid not null,
  owner_user_id uuid references auth.users(id) on delete set null,
  full_name text,
  company_name text,
  email text,
  phone text,
  job_title text,
  linkedin_url text,
  source text,
  status text,
  notes text,
  custom_fields jsonb not null default '{}'::jsonb,
  last_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (stage_id, workspace_id)
    references public.funnel_stages (id, workspace_id)
    on delete restrict
);

create index if not exists idx_leads_workspace_id on public.leads (workspace_id);
create index if not exists idx_leads_workspace_stage_id on public.leads (workspace_id, stage_id);
create index if not exists idx_leads_workspace_owner_user_id on public.leads (workspace_id, owner_user_id);
create index if not exists idx_leads_workspace_last_contacted_at on public.leads (workspace_id, last_contacted_at);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  channel text not null default 'email',
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name),
  unique (id, workspace_id)
);

create index if not exists idx_campaigns_workspace_id on public.campaigns (workspace_id);
create index if not exists idx_campaigns_workspace_is_active on public.campaigns (workspace_id, is_active);

create table if not exists public.lead_message_suggestions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null,
  campaign_id uuid not null,
  variant_index integer not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, campaign_id, variant_index),
  foreign key (lead_id, workspace_id)
    references public.leads (id, workspace_id)
    on delete cascade,
  foreign key (campaign_id, workspace_id)
    references public.campaigns (id, workspace_id)
    on delete cascade
);

create index if not exists idx_lms_workspace_id on public.lead_message_suggestions (workspace_id);
create index if not exists idx_lms_workspace_lead_id on public.lead_message_suggestions (workspace_id, lead_id);
create index if not exists idx_lms_workspace_campaign_id on public.lead_message_suggestions (workspace_id, campaign_id);

alter table public.funnel_stages enable row level security;
alter table public.leads enable row level security;
alter table public.campaigns enable row level security;
alter table public.lead_message_suggestions enable row level security;

drop policy if exists funnel_stages_select on public.funnel_stages;
create policy funnel_stages_select
on public.funnel_stages
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists funnel_stages_insert on public.funnel_stages;
create policy funnel_stages_insert
on public.funnel_stages
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

drop policy if exists funnel_stages_update on public.funnel_stages;
create policy funnel_stages_update
on public.funnel_stages
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists funnel_stages_delete on public.funnel_stages;
create policy funnel_stages_delete
on public.funnel_stages
for delete
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists leads_select on public.leads;
create policy leads_select
on public.leads
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists leads_insert on public.leads;
create policy leads_insert
on public.leads
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

drop policy if exists leads_update on public.leads;
create policy leads_update
on public.leads
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists leads_delete on public.leads;
create policy leads_delete
on public.leads
for delete
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists campaigns_select on public.campaigns;
create policy campaigns_select
on public.campaigns
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists campaigns_insert on public.campaigns;
create policy campaigns_insert
on public.campaigns
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

drop policy if exists campaigns_update on public.campaigns;
create policy campaigns_update
on public.campaigns
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists campaigns_delete on public.campaigns;
create policy campaigns_delete
on public.campaigns
for delete
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists lead_message_suggestions_select on public.lead_message_suggestions;
create policy lead_message_suggestions_select
on public.lead_message_suggestions
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists lead_message_suggestions_insert on public.lead_message_suggestions;
create policy lead_message_suggestions_insert
on public.lead_message_suggestions
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

drop policy if exists lead_message_suggestions_update on public.lead_message_suggestions;
create policy lead_message_suggestions_update
on public.lead_message_suggestions
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists lead_message_suggestions_delete on public.lead_message_suggestions;
create policy lead_message_suggestions_delete
on public.lead_message_suggestions
for delete
to authenticated
using (public.is_workspace_member(workspace_id));

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.funnel_stages to authenticated;
grant select, insert, update, delete on table public.leads to authenticated;
grant select, insert, update, delete on table public.campaigns to authenticated;
grant select, insert, update, delete on table public.lead_message_suggestions to authenticated;

grant execute on function public.is_workspace_member(uuid) to authenticated;
