# PolarisCRM

## Descrição do projeto

**PolarisCRM** é um CRM focado em **SDR** (prospecção e qualificação de leads). Neste repositório o **MVP front-end** está em `web/`, construído com **Next.js (App Router)**, **TypeScript** e **Tailwind CSS**, com **tema claro/escuro**, shell de layout (`AppShell`, barra superior, componentes de UI base), autenticação inicial (`/login`, `/register`, recuperação de senha) e preparação para **Supabase** no navegador. Outros pacotes (por exemplo uma API em Node) podem coexistir na raiz do monorepo.

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
- **Fluxo de autenticação no App Router com UX acessível:** foi necessário introduzir login, cadastro e recuperação de senha com feedback claro sem backend próprio. **Solução:** páginas client-side conectadas ao Supabase Auth, mensagens de erro amigáveis para cenários comuns (credenciais inválidas e e-mail já usado), estados de loading e redirecionamento pós-login para onboarding de workspace.
- **Entrada condicional na home (`/`) com sessão local do Supabase:** era necessário evitar página inicial neutra e acelerar navegação do usuário autenticado. **Solução:** transformar `/` em auth gate client-side via `supabase.auth.getSession()` (sessão persistida em storage local), redirecionando para `/dashboard` quando logado e `/login` quando não autenticado.
- **Confirmação de e-mail no ambiente local:** havia ambiguidade entre confirmação obrigatória e sessão imediata no cadastro. **Solução:** confirmação por e-mail habilitada no Supabase local (`enable_confirmations = true`) e documentação do Inbucket (`http://127.0.0.1:54324`) para inspeção dos e-mails de auth durante desenvolvimento.
- **Feedback explícito de confirmação pendente no signup:** era importante orientar o usuário após cadastro sem sessão imediata. **Solução:** criação da rota `/email-confirmation-pending` e redirecionamento automático do `/register` para essa página quando a conta exige confirmação de e-mail.
- **Cliente Supabase no render de Client Components:** `getSupabaseBrowserClient()` não pode rodar durante o pré-render no servidor. **Solução:** instanciar o cliente apenas dentro de `useEffect` ou de handlers de evento (submit), nunca no corpo do render com `useMemo`/`useState` inicial.
- **Gestão de sessão na área logada:** era necessário sair da conta e atualizar senha sem depender só de fluxos de e-mail. **Solução:** menu de conta na `TopBar` com logout e rota dedicada `/account/password` usando `updateUser` com sessão ativa.
- **Recuperação de senha “sem e-mail” no dev local:** o stack local não entrega e-mail real e o Auth pode bloquear `redirectTo` fora da allow-list. **Solução:** documentação e UI apontando o Inbucket, ampliação de `additional_redirect_urls` para `localhost` e `127.0.0.1`, e limite de envio por hora mais adequado para testes.
- **Redefinição de senha após o link do e-mail:** o reset não deve cair direto no login sem contexto. **Solução:** fluxo principal em `/forgot-password` (código + nova senha na mesma página), com `redirectTo` do e-mail apontando para essa rota; link legado em `/auth/reset-password` apenas redireciona preservando o hash.
- **Política de senha e OTP de recuperação:** o produto precisava de regras claras de complexidade e de um caminho sem clicar no link. **Solução:** validação compartilhada (8+ caracteres com maiúscula, minúscula, número e especial) em cadastro, troca de senha e reset; fluxo com código de 6 dígitos via `verifyOtp` em `/forgot-password`; Auth local alinhado com `password_requirements` no `config.toml`.
- **E-mail de recuperação sem link visível:** o template padrão do Auth incluía URL de confirmação. **Solução:** template em `supabase/templates/recovery.html` com `content_path = "./supabase/templates/recovery.html"` (relativo à raiz do repo ao rodar o CLI), assunto e corpo em português com `{{ .Token }}` e logo via `{{ .SiteURL }}/logoFull.svg` (exige `site_url` apontando para a app com `public/logoFull.svg` servido; em produção, alguns clientes de e-mail tratam melhor PNG do que SVG no `<img>`).
- **Saída indevida no fluxo de nova senha:** ao clicar no header durante `/forgot-password` (etapas de código/nova senha), o usuário podia sair do fluxo e cair no `dashboard`. **Solução:** `AuthCard` passou a aceitar `logoHref` opcional e o fluxo de recuperação desabilita o link da logo fora da etapa de e-mail, evitando fuga acidental antes de salvar a senha.

## Funcionalidades implementadas

### Obrigatórios (MVP base)

- [x] App Next.js em `web/` com App Router e TypeScript
- [x] Tailwind CSS v4 e estilos globais
- [x] ESLint + Prettier e scripts de formatação
- [x] Tema claro/escuro com persistência (cookie + `localStorage`) e toggle na UI
- [x] Layout shell (`AppShell`, `TopBar` com ícone Polaris em `public/logo.svg`, `ThemeToggle`) e componentes base (`Button`, `Card`)
- [x] Cliente Supabase no browser (`getSupabaseBrowserClient`) e `.env.example` documentado

### Diferenciais / próximos passos (não entregues neste escopo)

- [x] Autenticação inicial com páginas `/login`, `/register` e `/forgot-password`
- [x] CLI Supabase na raiz (`supabase init`, migração inicial vazia, doc local)
- [x] Modelo inicial de dados para tenancy (`workspaces` e `workspace_members`)
- [x] Multi-tenancy inicial e RLS de memberships por usuário
- [x] Redirecionamento pós-login para onboarding em `/onboarding/workspace`
- [x] Auth gate na rota `/` com redirecionamento para `/dashboard` ou `/login`
- [x] Fluxo de cadastro ajustado para lidar com confirmação de e-mail ou sessão imediata
- [x] Página `/email-confirmation-pending` com orientação de confirmação de conta
- [x] Rota `/account/password` para definir ou trocar senha com sessão ativa
- [x] Menu de conta na `TopBar` com logout e acesso à troca de senha
- [x] Recuperação de senha em `/forgot-password` (e-mail → código → nova senha) com retorno ao login após salvar
- [x] Política de senha (complexidade) e código OTP de 6 dígitos na recuperação em `/forgot-password`
- [x] Template de e-mail de recuperação local sem link (código OTP, PT-BR e logo)
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
