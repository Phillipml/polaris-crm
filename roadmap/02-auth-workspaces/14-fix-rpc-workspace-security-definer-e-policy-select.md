# 14 - Fix RPC de workspace com security definer e policy de select

## Ação realizada

- Persistia `403 Forbidden` na chamada `rpc/create_workspace_with_owner` mesmo com sessão válida.
- Criada migration `20260416033000_fix_workspace_rpc_security_and_select_policy.sql` com:
  - política de leitura em `public.workspaces` para usuários que são membros (`workspace_members.user_id = auth.uid()`),
  - atualização da função `create_workspace_with_owner` para `security definer`,
- Migration aplicada no ambiente local via `supabase db push --local`.

## Resultado

- Criação de workspace via RPC fica estável no fluxo autenticado.
- Leitura de workspaces relacionados ao usuário fica explícita na camada de policy.
