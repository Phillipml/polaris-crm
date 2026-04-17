select key, length(value) as secret_length
from public.app_runtime_config
where key in ('lead_stage_webhook_url', 'lead_stage_webhook_secret');