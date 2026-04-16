# PolarisCRM — Web (Next.js App Router)

MVP front-end com TypeScript, Tailwind CSS v4, ESLint + Prettier, cliente Supabase no browser e fluxo inicial de autenticação.

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
| `npm run test:rls`     | Teste de isolamento RLS        |

## Pastas (`src/`)

- `app/` — rotas App Router, layout e estilos globais
- `components/` — layout, providers, UI e utilitários de dev
- `components/auth/` — estrutura visual compartilhada para telas de autenticação
- `lib/auth/` — mensagens de erro, política de senha (`password-policy.ts`) e validação compartilhada
- `lib/supabase/` — factory do cliente browser (`getSupabaseBrowserClient`; chame só no browser, por exemplo em `useEffect` ou em handlers, não no render inicial de Client Components)
- `lib/theme/` — constantes e script de bootstrap do tema

## Teste automatizado de RLS

O cenário `tests/rls/leads-workspace-isolation.test.mjs` valida que um usuário autenticado não lista leads de outro workspace mesmo conhecendo `workspace_id` e `lead.id`.

Variáveis esperadas:

- `SUPABASE_TEST_URL` — padrão `http://127.0.0.1:54321`
- `SUPABASE_TEST_PUBLISHABLE_KEY` — saída de `npx supabase@latest status`
- `SUPABASE_TEST_SECRET_KEY` — saída de `npx supabase@latest status`
- `SUPABASE_TEST_PASSWORD` — opcional; padrão `Polaris@Test123!`

## Rotas de autenticação

- `/` — gate de autenticação: redireciona para `/dashboard` (logado) ou `/login` (não logado)
- `/login` — login com e-mail e senha, incluindo mensagem para credenciais inválidas
- `/register` — cadastro com e-mail/senha, incluindo tratamento para e-mail já usado
- `/email-confirmation-pending` — página de orientação após cadastro que requer confirmação por e-mail
- `/forgot-password` — recuperação em etapas na mesma página: e-mail → código de 6 dígitos do e-mail → nova senha; em API local os códigos aparecem no Inbucket (`http://127.0.0.1:54324`)
- `/auth/reset-password` — redireciona para `/forgot-password` (compatível com links antigos; preserva `#` da URL)
- `/onboarding/workspace` — onboarding de workspace: lista workspaces existentes, cria novo via RPC e permite selecionar para continuar
- `/dashboard` — área inicial para sessão autenticada
- `/account/password` — definir ou alterar senha (requer sessão; senão redireciona ao login)

## Observações de UX no onboarding

- Clicar nas logos (header e onboarding) redireciona para `/`.
- Após criar workspace, não há redirect automático: a lista é atualizada localmente e o usuário seleciona o workspace para continuar.
