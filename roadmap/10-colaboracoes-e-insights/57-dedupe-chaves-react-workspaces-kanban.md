# 57 — Chaves React duplicadas: dedupe de workspaces, etapas e membros

## Problema

Aviso do React: dois filhos com a mesma `key` (UUID). Não vem de “dois workspaces com o mesmo nome”: a `key` era o **id** (workspace, etapa ou usuário). Causas prováveis: linhas repetidas na resposta da API, re-render com estado acumulado ou, no Kanban, **mesmo `draggableId` / `key` de lead** se houvesse duplicata na lista de leads.

## Ação

- `onboarding/workspace/page.tsx`: ao montar a lista, ignora segundo `workspace_id` repetido na lista de memberships.
- `dashboard/page.tsx`: `uniqueStages` por `id` ordenado por `position`; sincronização de `boardLeads` a partir de `leads` com dedupe por `id` do lead.
- `funnel-stages-service.ts`: retorno de etapas deduplicado por `id` e ordenado por `position`.
- `settings/workspace-members/page.tsx`: listas de membros deduplicadas por `user_id`.

## Escopo de commit sugerido

- `web/src/app/onboarding/workspace/page.tsx`
- `web/src/app/dashboard/page.tsx`
- `web/src/lib/funnel-stages/funnel-stages-service.ts`
- `web/src/app/settings/workspace-members/page.tsx`
- `roadmap/10-colaboracoes-e-insights/57-dedupe-chaves-react-workspaces-kanban.md`
