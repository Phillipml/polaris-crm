# 66 — Owner pode apagar workspace

## O que foi feito

- Migration `supabase/migrations/20260419004500_delete_workspace_owner_rpc.sql` com RPC `delete_workspace_as_owner(p_workspace_id uuid)`.
- A função permite apagar workspace apenas quando o usuário autenticado é `owner` naquele workspace.
- Se não for owner, retorna erro de permissão; se não existir, retorna erro de workspace não encontrado.
- UI de onboarding (`web/src/app/onboarding/workspace/page.tsx`) ganhou ação "Apagar" para workspaces em que o usuário é owner.
- A ação exige confirmação e remove o workspace da lista local após sucesso; se era o workspace selecionado no browser, limpa `localStorage`.

## Como validar

- Como owner, apagar um workspace e confirmar remoção da lista.
- Como admin/member, verificar que não aparece ação de apagar.
- Tentar chamada direta da RPC sem owner e validar erro de permissão.
