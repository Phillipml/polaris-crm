# 43 — Database Webhook + Edge P8.2 (`p82-lead-stage-webhook`)

## O que foi feito

- Edge `supabase/functions/p82-lead-stage-webhook/` com `POST`, validação de header `X-Webhook-Secret` contra secret `P82_WEBHOOK_SECRET` (via secrets do projeto), processamento de payload estilo Database Webhook (`type`, `table`, `record`, `old_record`).
- Regra de disparo documentada: apenas `UPDATE` em `leads` com `record.stage_id` distinto de `old_record.stage_id`; `INSERT` retorna skip explícito.
- Idempotência por campanha e transição na tabela `public.lead_stage_webhook_campaign_dedupe` (PK composta).
- Geração automática somente para campanhas ativas com `trigger_stage_id` igual ao novo `stage_id`, persistindo `lead_message_suggestions` com `source = auto_trigger`.
- Migration `supabase/migrations/20260417140000_p82_lead_stage_webhook_pg_net.sql`: extensão `pg_net`, tabelas `app_runtime_config` e dedupe, trigger opcional em `leads` após `UPDATE` (no-op se URL ou secret vazios).
- Documentação operacional em `supabase/README.md` e checklist no `README.md` da raiz.

## Observações

- Em produção, evite acionar **ao mesmo tempo** Database Webhook do painel e o trigger `pg_net` com o mesmo secret sem necessidade; a dedupe reduz impacto, mas ainda haverá chamadas duplicadas à Edge.
- Para o fluxo manual do Kanban disparar geração, é preciso existir campanha com `trigger_stage_id` apontando para a etapa de destino.
