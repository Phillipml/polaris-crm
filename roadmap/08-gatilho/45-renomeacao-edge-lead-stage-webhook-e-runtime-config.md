# 45 — Renomeação da Edge e das chaves de runtime (webhook de etapa do lead)

## O que foi feito

- Edge em `supabase/functions/lead-stage-webhook/` com secret de ambiente `LEAD_STAGE_WEBHOOK_SECRET` (substitui nomenclatura pessoal anterior).
- Migration `20260417140000_p82_lead_stage_webhook_pg_net.sql` ajustada para inserts e leituras em `app_runtime_config` com chaves `lead_stage_webhook_url` e `lead_stage_webhook_secret`, URL local padrão `/functions/v1/lead-stage-webhook`.
- Nova migration `20260417160000_lead_stage_webhook_rename_runtime_config_from_p82.sql` para bases que já tinham chaves `p82_*`, atualização de URL com slug antigo no path e `CREATE OR REPLACE` de `leads_stage_change_webhook_enqueue` alinhado às chaves novas.
- `supabase/.env.example`, `supabase/README.md`, `README.md` da raiz e roadmaps `43` e `44` atualizados para a nomenclatura de produto; roadmap `43` renomeado para `43-database-webhook-lead-stage-edge.md`.

## Operação

- No Supabase (secrets da Edge), definir `LEAD_STAGE_WEBHOOK_SECRET` e apontar o Database Webhook para `/functions/v1/lead-stage-webhook`.
- Se usava trigger `pg_net`, preencher `lead_stage_webhook_url` e `lead_stage_webhook_secret` em `app_runtime_config` (a migration `17160000` migra valores legados quando existirem).
