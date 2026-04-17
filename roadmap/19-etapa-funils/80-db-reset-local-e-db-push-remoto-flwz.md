# 86 — Migrações Supabase: local (reset) e remoto flwzdemuhyveylyvgtcz

## Ação

1. **Local:** `npx supabase@latest db reset` na raiz do repositório com stack `supabase start` ativo — recria o Postgres local, aplica todas as migrações em ordem e executa `supabase/seed.sql`.
2. **Remoto:** `npx supabase@latest link --project-ref flwzdemuhyveylyvgtcz` seguido de `npx supabase@latest db push` — o painel indicou **Remote database is up to date** (nenhuma migração pendente em relação aos arquivos em `supabase/migrations/`).

## Observação

O `db reset` local **apaga** dados do banco de desenvolvimento; use contas e workspaces de teste após o reset.
