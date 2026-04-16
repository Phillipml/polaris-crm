# 03 — Supabase local (CLI, migração baseline, docs)

## O que foi feito

- Executado **`npx supabase init`** na raiz do repositório, gerando `supabase/config.toml` e `.gitignore` do CLI.
- Criada migração inicial **`supabase/migrations/20260416014601_initial.sql`** (baseline mínima com `select 1`) e **`supabase/seed.sql`** referenciado em `[db.seed]` (no-op) para `supabase db reset` não falhar por arquivo ausente.
- Documentação em **`supabase/README.md`**: `supabase start`, `status`, migrações (`migration new`, `db reset`, `migration up`), link opcional ao projeto remoto (`login`, `link`, `db pull` / `db push`), `stop`.
- **`web/.env.example`** atualizado com URL local padrão (`http://127.0.0.1:54321`) e instrução de copiar a **anon key** do `status` para `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **`web/README.md`** e **`README.md`** da raiz referenciam o fluxo local e a pasta `supabase/`.
