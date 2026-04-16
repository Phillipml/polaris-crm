# 13 - Fix RPC create workspace 403 com grants

## Ação realizada

- Identificado `403 Forbidden` na chamada `rpc/create_workspace_with_owner` mesmo com sessão autenticada.
- Adicionada migration `supabase/migrations/20260416031500_workspace_grants_authenticated.sql` para garantir permissões da role `authenticated` em `public.workspaces` e `public.workspace_members`.
- Migration aplicada no ambiente local com `supabase db push --local`.

## Resultado

- A role autenticada passa a ter permissões necessárias para executar a RPC e inserir em `workspaces` e `workspace_members`.
