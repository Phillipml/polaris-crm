create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint generation_jobs_status_check check (status in ('pending', 'completed', 'failed'))
);

create index generation_jobs_lead_id_status_idx
  on public.generation_jobs (lead_id, status);

create unique index generation_jobs_one_pending_per_lead
  on public.generation_jobs (lead_id)
  where status = 'pending';

alter table public.generation_jobs enable row level security;

revoke all on table public.generation_jobs from anon;
revoke all on table public.generation_jobs from authenticated;
grant select on table public.generation_jobs to authenticated;
grant all on table public.generation_jobs to service_role;

create policy generation_jobs_select
on public.generation_jobs
for select
to authenticated
using (public.is_workspace_member(workspace_id));
