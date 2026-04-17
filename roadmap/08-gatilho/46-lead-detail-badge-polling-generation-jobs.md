# 46 — Detalhe do lead: badge de geração automática e polling

## O que foi feito

- Migration `supabase/migrations/20260417170000_generation_jobs.sql`: tabela `generation_jobs` (`workspace_id`, `lead_id`, `status` pending/completed/failed), índice por lead/status, índice único parcial um `pending` por lead, RLS de leitura para membros do workspace, `service_role` com acesso total para a Edge.
- Edge `lead-stage-webhook`: antes do loop de campanhas remove pendências antigas do mesmo lead, insere job `pending`, atualiza para `completed` ou `failed` em todos os retornos de erro e ao sucesso final.
- Front: `web/src/lib/generation-jobs/generation-jobs-service.ts` agrega `hasPending` (via `generation_jobs`) e `lastAutoAt` (máximo `created_at` de `lead_message_suggestions` com `source = auto_trigger`).
- Página `web/src/app/leads/[id]/page.tsx`: badge “Gerando sugestões…”, polling a cada 2s enquanto houver pendente (parada do intervalo após 90s; o badge permanece se o job ainda estiver `pending`), atualização da lista de sugestões da campanha selecionada a cada tick; linha “Última geração automática em …” quando existir `lastAutoAt`.
- Tipos em `web/src/lib/supabase/database.types.ts` para `generation_jobs`.

## Observações

- Ambientes sem a migration ainda tratam erro de leitura em `generation_jobs` como ausência de pendência; a linha de última geração automática continua possível via sugestões `auto_trigger`.
