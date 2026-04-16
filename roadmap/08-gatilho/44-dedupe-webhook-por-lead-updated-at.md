# 44 — Dedupe do webhook de mudança de etapa por `leads.updated_at` (rodada)

## O que foi feito

- Migration `supabase/migrations/20260417150000_lead_stage_webhook_dedupe_lead_updated_at.sql` alterando a PK de `lead_stage_webhook_campaign_dedupe` para incluir **`leads_updated_at`** (valor do `updated_at` do lead na transição).
- Edge `lead-stage-webhook` passa a gravar e limpar dedupe usando o **`lead.updated_at` lido após o commit** (via `select` do lead), alinhado à mesma “rodada” do `UPDATE`.

## Resultado

- Reentrega do mesmo webhook (mesmo `old`/`new`/`updated_at`) continua idempotente.
- Nova transição com o mesmo par de estágios em outro momento gera nova rodada porque o **`updated_at`** do lead muda.
