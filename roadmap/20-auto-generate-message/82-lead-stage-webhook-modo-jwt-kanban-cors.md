# 49 — Gatilho de etapa: modo JWT no Kanban e CORS na Edge

## Ação

- **`supabase/functions/lead-stage-webhook/index.ts`**: resposta **OPTIONS** com CORS; corpo JSON **sem** campo `type` interpretado como transição iniciada pelo app (`lead_id`, `old_stage_id`, `new_stage_id`), validação com **Bearer** + **`auth.getUser`** + **`workspace_members`**, mesma rotina de campanhas ativas, dedupe e LLM que o webhook do Supabase; fluxo com **`X-Webhook-Secret`** mantido para Database Webhook / `pg_net`.
- **`web/src/lib/leads/leads-service.ts`**: função **`notifyLeadStageAutoGeneration`** usando **`supabase.functions.invoke("lead-stage-webhook", …)`** com Authorization da sessão.
- **`web/src/app/dashboard/page.tsx`**: após drag bem-sucedido, **`void notifyLeadStageAutoGeneration`** com origem e destino do arraste.
- **`web/src/lib/outreach-events/outreach-events-service.ts`**: leitura de **`stage_id`** antes da transição para **`trying_contact`** e mesma notificação quando a etapa muda de fato.
- **`README.md`**: documentação do modo duplo e do fallback quando o secret/`pg_net` local não está configurado.

## Motivo

Sem URL/secret em **`app_runtime_config`** ou sem Database Webhook, o HTTP para a Edge não era disparado após **`db reset`** ou ambientes incompletos; o usuário deixava de ver sugestões automáticas ao mover o lead. A invocação explícita pelo cliente restaura o comportamento esperado no Kanban e na abertura do lead, com dedupe se o webhook também existir.
