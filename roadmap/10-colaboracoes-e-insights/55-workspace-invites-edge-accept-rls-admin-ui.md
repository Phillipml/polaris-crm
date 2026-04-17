# 55 — Convites de workspace, Edge accept-invite e RLS por papel

## Ação

- Migration `supabase/migrations/20260418120000_workspace_invites_and_members_admin_rls.sql`: tabela `workspace_invites` (`email`, `role` admin|member, `token`, `expires_at`, `invited_by`, `accepted_at`), índice único parcial por workspace+e-mail pendente, trigger de normalização de e-mail, função `is_workspace_owner_or_admin`, políticas em `workspace_invites` (select/delete só owner/admin), substituição das políticas de `workspace_members` (select por membro do workspace; insert bootstrap owner; update/delete só owner/admin com proteção ao remover último owner), RPCs `create_workspace_invite` e `list_workspace_members_directory`.
- Edge `supabase/functions/accept-invite/` com `POST` JSON `{ token }`, JWT validado, comparação de e-mail do convite com `auth.getUser`, insert em `workspace_members` via service role e marcação de `accepted_at`; respostas de negócio com HTTP 200 e `{ error }` para o `invoke` do browser.
- `supabase/config.toml`: `[functions.accept-invite] verify_jwt = true`.
- Web: `web/src/app/settings/workspace-members/page.tsx`, `web/src/app/accept-invite/page.tsx`, links no dashboard e no menu do usuário, `login` com parâmetro `next` seguro (path interno), tipos em `database.types.ts` para `workspace_invites`.
- Documentação em `README.md` e `supabase/README.md`.

## Escopo de commit sugerido

- `supabase/migrations/20260418120000_workspace_invites_and_members_admin_rls.sql`
- `supabase/functions/accept-invite/`
- `supabase/config.toml`
- `web/src/app/settings/workspace-members/page.tsx`
- `web/src/app/accept-invite/page.tsx`
- `web/src/app/login/page.tsx`
- `web/src/app/dashboard/page.tsx`
- `web/src/components/layout/UserMenu.tsx`
- `web/src/lib/supabase/database.types.ts`
- `README.md`
- `supabase/README.md`
- `roadmap/02-auth-workspaces/18-workspace-invites-edge-accept-rls-admin-ui.md`
