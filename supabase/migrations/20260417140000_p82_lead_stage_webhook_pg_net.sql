create extension if not exists pg_net;

create table if not exists public.app_runtime_config (
  key text primary key,
  value text not null
);

create table if not exists public.lead_stage_webhook_campaign_dedupe (
  lead_id uuid not null,
  campaign_id uuid not null,
  old_stage_id uuid not null,
  new_stage_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (lead_id, campaign_id, old_stage_id, new_stage_id)
);

alter table public.lead_stage_webhook_campaign_dedupe enable row level security;

revoke all on table public.app_runtime_config from anon, authenticated;
revoke all on table public.lead_stage_webhook_campaign_dedupe from anon, authenticated;
grant all on table public.app_runtime_config to service_role;
grant all on table public.lead_stage_webhook_campaign_dedupe to service_role;

insert into public.app_runtime_config (key, value)
values
  ('p82_lead_stage_webhook_url', 'http://kong:8000/functions/v1/p82-lead-stage-webhook'),
  ('p82_lead_stage_webhook_secret', '')
on conflict (key) do nothing;

create or replace function public.leads_stage_change_webhook_enqueue()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hook_url text;
  hook_secret text;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if new.stage_id is not distinct from old.stage_id then
    return new;
  end if;

  select value into hook_url
  from public.app_runtime_config
  where key = 'p82_lead_stage_webhook_url';

  select value into hook_secret
  from public.app_runtime_config
  where key = 'p82_lead_stage_webhook_secret';

  if coalesce(hook_url, '') = '' or coalesce(hook_secret, '') = '' then
    return new;
  end if;

  perform net.http_post(
    url := hook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Webhook-Secret', hook_secret
    ),
    body := jsonb_build_object(
      'type', 'UPDATE',
      'table', 'leads',
      'schema', 'public',
      'record', to_jsonb(new),
      'old_record', to_jsonb(old)
    ),
    timeout_milliseconds := 8000
  );

  return new;
end;
$$;

drop trigger if exists trg_leads_stage_change_webhook on public.leads;

create trigger trg_leads_stage_change_webhook
after update on public.leads
for each row
execute function public.leads_stage_change_webhook_enqueue();

grant usage on schema net to postgres;
grant execute on all functions in schema net to postgres;
