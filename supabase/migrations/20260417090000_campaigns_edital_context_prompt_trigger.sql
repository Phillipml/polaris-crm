alter table public.campaigns
  add column if not exists context_markdown text,
  add column if not exists generation_prompt text not null default '',
  add column if not exists trigger_stage_id uuid,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'campaigns_trigger_stage_fk'
  ) then
    alter table public.campaigns
      add constraint campaigns_trigger_stage_fk
      foreign key (trigger_stage_id, workspace_id)
      references public.funnel_stages (id, workspace_id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_campaigns_workspace_trigger_stage
  on public.campaigns (workspace_id, trigger_stage_id)
  where trigger_stage_id is not null;
