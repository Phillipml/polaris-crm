# PolarisCRM — Web (Next.js App Router)

MVP front-end com TypeScript, Tailwind CSS v4, ESLint + Prettier e cliente Supabase no browser.

## Variáveis de ambiente

1. Na pasta `web/`, copie o exemplo:

   ```bash
   copy .env.example .env.local
   ```

   Em macOS ou Linux:

   ```bash
   cp .env.example .env.local
   ```

2. Edite `.env.local` com **`NEXT_PUBLIC_SUPABASE_URL`** e **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`**. No projeto remoto: **Settings → API**. No stack local: saída de `npx supabase@latest status` na raiz do repo (use a **Publishable key** nesse campo).

3. Reinicie `npm run dev` após alterar `.env.local`.

O arquivo `.env.local` não deve ser versionado (já ignorado pelo `.gitignore`).

### Supabase local (dev)

1. Na **raiz** do monorepo, com Docker ativo: `npx supabase@latest start`.
2. `npx supabase@latest status` → copie **Project URL** (ex.: `http://127.0.0.1:54321`) e **Publishable key** para o `.env.local` do `web/`.
3. Para aplicar migrações baseline no Postgres local: `npx supabase@latest db reset` (migrações em `supabase/migrations/` + `supabase/seed.sql`).

Guia completo: **`../supabase/README.md`**.

## Scripts

| Comando                | Descrição                      |
| ---------------------- | ------------------------------ |
| `npm run dev`          | Servidor de desenvolvimento    |
| `npm run build`        | Build de produção              |
| `npm run start`        | Servidor após build            |
| `npm run lint`         | ESLint (Next)                  |
| `npm run format`       | Prettier (gravar)              |
| `npm run format:check` | Prettier (somente verificação) |

## Pastas (`src/`)

- `app/` — rotas App Router, layout e estilos globais
- `components/` — layout, providers, UI e utilitários de dev
- `lib/supabase/` — factory do cliente browser (`getSupabaseBrowserClient`)
- `lib/theme/` — constantes e script de bootstrap do tema
