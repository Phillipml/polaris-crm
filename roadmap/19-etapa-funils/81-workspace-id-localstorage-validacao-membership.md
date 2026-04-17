# 81 — Validar workspace salvo no browser contra membership

## Problema

Após `db reset` local (ou troca de projeto Supabase), `localStorage` podia manter `polaris.currentWorkspaceId` de um workspace que não existe mais ou do qual o usuário não é membro. O app lia esse UUID e consultava `funnel_stages` e leads com RLS ativo, resultando em **lista vazia** de etapas no Kanban e em Configurações → Etapas do funil.

## Solução

- Hook `useResolvedWorkspaceId` em `web/src/hooks/use-resolved-workspace-id.ts`: após `getSession`, confere `workspace_members` para o par `(user_id, workspace_id)` igual ao valor armazenado; se não existir, remove a chave do `localStorage` e expõe `workspaceId` nulo.
- Constante exportada `WORKSPACE_STORAGE_KEY` usada em onboarding e accept-invite para evitar divergência de string.
- Dashboard, páginas de settings que dependem do workspace e `leads/[id]` passam a usar o hook em vez de ler só `localStorage` no mount.
- Mensagens no dashboard e em etapas do funil quando não há workspace válido ou quando não há etapas após carregar.
