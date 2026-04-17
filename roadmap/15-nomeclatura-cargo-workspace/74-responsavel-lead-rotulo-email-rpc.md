# 74 - Responsável no lead: rótulo com e-mail e RPC para membros

## Contexto

O select de **Responsável** no lead (e o filtro equivalente no dashboard) mostrava prefixo de `user_id` e papel em inglês, pouco legível para operação diária.

## Causa

`workspace_members` no cliente não expõe `auth.users.email` via PostgREST; só quem chama `list_workspace_members_directory` recebia e-mail, mas essa RPC é restrita a owner/admin.

## Ações implementadas

- Migration `20260419120000_list_workspace_members_for_assignee.sql` com RPC `list_workspace_members_for_assignee(p_workspace uuid)` (`SECURITY DEFINER`), permitida para qualquer `is_workspace_member`, retornando JSON com `workspace_id`, `user_id`, `email`, `role`, `created_at`.
- `listWorkspaceMembers` em `web/src/lib/workspaces/workspace-members-service.ts` passou a consumir essa RPC e tipar `email` no retorno.
- Helpers em `web/src/lib/workspaces/member-assignee-label.ts` para parte local do e-mail e rótulo `nome(papel)` com papel em minúsculas (`administrador`, `membro`), com fallback aos primeiros 8 caracteres do `user_id` se não houver e-mail.
- Uso nos selects de `web/src/app/leads/[id]/page.tsx` e `web/src/app/dashboard/page.tsx`.
- Testes unitários e documentação em `README.md` e `supabase/README.md`.

## Deploy

Aplicar migration no projeto remoto (`db push`) para o select deixar de falhar com função inexistente.
