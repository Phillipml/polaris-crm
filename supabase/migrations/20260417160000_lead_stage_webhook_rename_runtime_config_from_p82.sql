do $$
declare
  v_url text;
  v_secret text;
begin
  select value into v_url
  from public.app_runtime_config
  where key = 'p82_lead_stage_webhook_url';

  select value into v_secret
  from public.app_runtime_config
  where key = 'p82_lead_stage_webhook_secret';

  if v_url is not null then
    delete from public.app_runtime_config where key = 'p82_lead_stage_webhook_url';
    insert into public.app_runtime_config (key, value)
    values (
      'lead_stage_webhook_url',
      replace(v_url, 'p82-lead-stage-webhook', 'lead-stage-webhook')
    )
    on conflict (key) do update set value = excluded.value;
  end if;

  if v_secret is not null then
    delete from public.app_runtime_config where key = 'p82_lead_stage_webhook_secret';
    insert into public.app_runtime_config (key, value)
    values ('lead_stage_webhook_secret', v_secret)
    on conflict (key) do update set value = excluded.value;
  end if;
end $$;

update public.app_runtime_config
set value = replace(value, 'p82-lead-stage-webhook', 'lead-stage-webhook')
where key = 'lead_stage_webhook_url'
  and value like '%p82-lead-stage-webhook%';

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
  where key = 'lead_stage_webhook_url';

  select value into hook_secret
  from public.app_runtime_config
  where key = 'lead_stage_webhook_secret';

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
