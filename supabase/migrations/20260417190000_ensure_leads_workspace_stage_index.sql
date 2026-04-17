create index if not exists idx_leads_workspace_stage_id
  on public.leads (workspace_id, stage_id);
