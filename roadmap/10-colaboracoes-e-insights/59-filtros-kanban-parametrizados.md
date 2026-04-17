# 59 — Barra de filtros no Kanban com queries parametrizadas

## O que foi feito

- Dashboard (`web/src/app/dashboard/page.tsx`) ganhou barra de filtros com:
  - busca textual por nome/empresa/e-mail com debounce de 350ms;
  - filtro por responsável;
  - filtro por etapa.
- Hook `useLeads` passou a aceitar `ownerUserId` e `searchText`, além de `stageId`.
- Serviço `listLeadsByWorkspaceAndStage` em `web/src/lib/leads/leads-service.ts` agora monta query parametrizada no Supabase com `workspace_id`, `stage_id`, `owner_user_id` e `ilike` para busca textual.
- O Kanban e os cards de resumo passaram a refletir o resultado filtrado retornado da query, sem filtro local redundante.

## Como validar

- Abrir `/dashboard`, selecionar responsável e etapa e conferir atualização do board.
- Digitar texto na busca e validar que a requisição só dispara após pequeno atraso (debounce).
- Limpar os filtros e confirmar retorno ao estado completo do workspace.
