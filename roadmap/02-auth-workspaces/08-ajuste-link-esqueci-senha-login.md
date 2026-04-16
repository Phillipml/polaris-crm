# 08 - Estabilização client-side do auth e conta logada

## Escopo consolidado

- Correção de SSR indevido em Client Components: `getSupabaseBrowserClient()`.
- Inclusão da rota `/account/password` para usuário autenticado trocar/definir senha com `updateUser`.
- Inclusão de `UserMenu` na `TopBar` com:
  - atalho para `/account/password`
  - logout com `signOut` e navegação para `/login`

## Resultado

Fluxo autenticado fica estável no App Router (sem erro de cliente Supabase no SSR) e com gestão básica de conta na UI.
