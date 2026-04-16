# 43 — Database Webhook + Edge `lead-stage-webhook`

## O que foi feito

- Edge `supabase/functions/lead-stage-webhook/` com `POST`, validação de header `X-Webhook-Secret` contra secret `LEAD_STAGE_WEBHOOK_SECRET` (via secrets do projeto), processamento de payload estilo Database Webhook (`type`, `table`, `record`, `old_record`).
- Regra de disparo documentada: apenas `UPDATE` em `leads` com `record.stage_id` distinto de `old_record.stage_id`; `INSERT` retorna skip explícito.
- Idempotência por campanha, transição e **rodada** (`public.lead_stage_webhook_campaign_dedupe` com PK incluindo `leads_updated_at`; ver roadmap `44-dedupe-webhook-por-lead-updated-at.md`).
- Geração automática somente para campanhas ativas com `trigger_stage_id` igual ao novo `stage_id`, persistindo `lead_message_suggestions` com `source = auto_trigger`.
- Migration `supabase/migrations/20260417140000_p82_lead_stage_webhook_pg_net.sql`: extensão `pg_net`, tabelas `app_runtime_config` e dedupe, trigger opcional em `leads` após `UPDATE` (no-op se URL ou secret vazios). Chaves de runtime: `lead_stage_webhook_url` e `lead_stage_webhook_secret`; URL padrão local aponta para `/functions/v1/lead-stage-webhook`.
- Migration `supabase/migrations/20260417160000_lead_stage_webhook_rename_runtime_config_from_p82.sql`: migração de instalações que ainda tinham chaves legadas `p82_*` e recria a função do trigger com as chaves novas.
- Documentação operacional em `supabase/README.md` e checklist no `README.md` da raiz.

## Observações

- Em produção, evite acionar **ao mesmo tempo** Database Webhook do painel e o trigger `pg_net` com o mesmo secret sem necessidade; a dedupe reduz impacto, mas ainda haverá chamadas duplicadas à Edge.
- Para o fluxo manual do Kanban disparar geração, é preciso existir campanha com `trigger_stage_id` apontando para a etapa de destino.
