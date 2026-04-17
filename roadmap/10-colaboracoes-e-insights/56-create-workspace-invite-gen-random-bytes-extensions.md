# 56 — Convite: gen_random_bytes via schema extensions

## Problema

A RPC `create_workspace_invite` usava `gen_random_bytes(32)` com `search_path = public, auth`. No Postgres do Supabase a função do `pgcrypto` fica em **`extensions`**, gerando erro `function gen_random_bytes(integer) does not exist` ao criar convite.

## Ação

- `supabase/migrations/20260418120000_workspace_invites_and_members_admin_rls.sql`: token gerado com `encode(extensions.gen_random_bytes(32), 'hex')`.
- `supabase/migrations/20260418140000_create_workspace_invite_gen_random_bytes_extensions.sql`: reaplica o `create or replace` da mesma função para bancos que já rodaram a migration anterior.

## Escopo de commit sugerido

- `supabase/migrations/20260418120000_workspace_invites_and_members_admin_rls.sql`
- `supabase/migrations/20260418140000_create_workspace_invite_gen_random_bytes_extensions.sql`
- `roadmap/02-auth-workspaces/19-create-workspace-invite-gen-random-bytes-extensions.md`
