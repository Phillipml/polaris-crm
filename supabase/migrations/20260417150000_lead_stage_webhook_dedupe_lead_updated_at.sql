alter table public.lead_stage_webhook_campaign_dedupe
  add column if not exists leads_updated_at timestamptz;

update public.lead_stage_webhook_campaign_dedupe
set leads_updated_at = created_at
where leads_updated_at is null;

alter table public.lead_stage_webhook_campaign_dedupe
  alter column leads_updated_at set not null;

do $$
declare
  pkname text;
begin
  select c.conname
  into pkname
  from pg_constraint c
  join pg_class t on c.conrelid = t.oid
  where t.relname = 'lead_stage_webhook_campaign_dedupe'
    and t.relnamespace = (select oid from pg_namespace where nspname = 'public')
    and c.contype = 'p';

  if pkname is not null then
    execute format(
      'alter table public.lead_stage_webhook_campaign_dedupe drop constraint %I',
      pkname
    );
  end if;
end $$;

alter table public.lead_stage_webhook_campaign_dedupe
  add constraint lead_stage_webhook_campaign_dedupe_pkey
  primary key (lead_id, campaign_id, old_stage_id, new_stage_id, leads_updated_at);
