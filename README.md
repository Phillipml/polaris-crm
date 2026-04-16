# PolarisCRM

## Descrição do projeto

**PolarisCRM** é um CRM focado em **SDR** (prospecção e qualificação de leads). Neste repositório o **MVP front-end** está em `web/`, construído com **Next.js (App Router)**, **TypeScript** e **Tailwind CSS**, com **tema claro/escuro**, shell de layout (`AppShell`, barra superior, componentes de UI base) e preparação para **Supabase** no navegador. Outros pacotes (por exemplo uma API em Node) podem coexistir na raiz do monorepo.

## Tecnologias utilizadas

| Área | Ferramentas / serviços |
|------|-------------------------|
| Framework web | Next.js 15 (App Router), React 19 |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS v4, PostCSS |
| Qualidade | ESLint (config Next), Prettier |
| Backend-as-a-service (cliente) | `@supabase/supabase-js` (cliente browser; variáveis `NEXT_PUBLIC_*`) |
| Versionamento / docs internas | Git; pasta `roadmap/` com entregas incrementais |

## Decisões técnicas

### Por que escolheu determinada estrutura de banco de dados

O repositório inclui **`supabase/`** (CLI: `supabase init`) e agora possui migração inicial de multi-tenancy com as tabelas `workspaces` e `workspace_members` em **PostgreSQL via Supabase**. A modelagem usa PK composta em membership (`workspace_id`, `user_id`) para evitar duplicidade de vínculo por usuário no mesmo workspace, com `user_id` ligado a `auth.users.id` para manter coerência com autenticação nativa do Supabase.

### Como estruturou a integração com LLM

**Ainda não implementado no código atual.** A estrutura planejada é integrar LLM no backend (Node/Edge Functions) para evitar exposição de chaves no cliente, com camadas de autorização por workspace antes de qualquer inferência e sanitização de payload para reduzir risco de vazamento de dados sensíveis.

### Como implementou o multi-tenancy

Foi implementada a base de **multi-tenancy por workspace** no Supabase:

- `workspaces`: entidade de tenant lógico (`id`, `name`, `created_at`).
- `workspace_members`: vínculo usuário-workspace com papel (`role`) e PK composta (`workspace_id`, `user_id`).
- RLS inicial: usuário autenticado lê apenas memberships onde `user_id = auth.uid()`.
- Criação inicial: usuário autenticado pode inserir workspace e inserir apenas o próprio membership como `owner`.
- Fluxo transacional recomendado via RPC `create_workspace_with_owner(workspace_name)` para criar workspace + owner membership na mesma chamada.

### Desafios encontrados e como resolveu

- **Divergência de tema entre SSR e cliente (hidratação):** o tema vinha de `localStorage` / `prefers-color-scheme` no script antes do React, enquanto o servidor não refletia o mesmo estado. **Solução:** tema inicial no servidor via cookie (`getServerTheme`) e headers `Accept-CH` / `Vary` no `next.config.ts`; script de bootstrap só ajusta o DOM quando há valor válido em `localStorage` e sincroniza cookie; `ThemeProvider` recebe `initialTheme` alinhado ao servidor. Detalhes em `roadmap/02-correcao-hidratacao-tema-layout.md`.
- **Primeira camada de RLS para multi-tenancy:** foi necessário equilibrar simplicidade inicial com segurança de acesso por usuário no Supabase. **Solução:** políticas mínimas e explícitas para leitura de memberships próprios e criação de workspace com owner membership do próprio usuário, além de RPC dedicada para garantir criação consistente em uma única operação.

## Funcionalidades implementadas

### Obrigatórios (MVP base)

- [x] App Next.js em `web/` com App Router e TypeScript
- [x] Tailwind CSS v4 e estilos globais
- [x] ESLint + Prettier e scripts de formatação
- [x] Tema claro/escuro com persistência (cookie + `localStorage`) e toggle na UI
- [x] Layout shell (`AppShell`, `TopBar`, `ThemeToggle`) e componentes base (`Button`, `Card`)
- [x] Cliente Supabase no browser (`getSupabaseBrowserClient`) e `.env.example` documentado

### Diferenciais / próximos passos (não entregues neste escopo)

- [ ] Autenticação e perfis de usuário
- [x] CLI Supabase na raiz (`supabase init`, migração inicial vazia, doc local)
- [x] Modelo inicial de dados para tenancy (`workspaces` e `workspace_members`)
- [x] Multi-tenancy inicial e RLS de memberships por usuário
- [ ] Telas de negócio SDR (cadastros, pipeline, tarefas)
- [ ] Integração com LLM

---

## Web (Next.js) — desenvolvimento rápido

Na pasta `web/`:

```bash
cd web
npm install
npm run dev
```

- **App:** http://localhost:3000  

### Variáveis de ambiente (Supabase)

1. Entre na pasta `web/`.
2. Copie `web/.env.example` para `web/.env.local` e ajuste os valores.
3. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (projeto remoto no dashboard **ou** stack local: `npx supabase@latest status` na raiz; use **Project URL** + **Publishable key** no ambiente local).
4. Reinicie o servidor de desenvolvimento.

Mais detalhes: `web/README.md` · Supabase local: `supabase/README.md`.

### Scripts úteis (`web/`)

| Comando | Descrição |
|--------|------------|
| `npm run dev` | Next.js em modo desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

### Pastas

- `web/` — Next.js App Router (TypeScript, tema, cliente Supabase no browser)
- `supabase/` — config e migrações do Supabase (dev local com Docker)
- `roadmap/` — registro incremental do que foi entregue
