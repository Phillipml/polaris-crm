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
| Edge / LLM (servidor) | Supabase Edge Functions (Deno 2), secrets `LLM_*` no projeto |
| Versionamento / docs internas | Git; pasta `roadmap/` com entregas incrementais |

## Decisões técnicas

### Por que escolheu determinada estrutura de banco de dados

O repositório inclui **`supabase/`** (CLI: `supabase init`) e agora possui migração inicial de multi-tenancy com as tabelas `workspaces` e `workspace_members` em **PostgreSQL via Supabase**. A modelagem usa PK composta em membership (`workspace_id`, `user_id`) para evitar duplicidade de vínculo por usuário no mesmo workspace, com `user_id` ligado a `auth.users.id` para manter coerência com autenticação nativa do Supabase.

A tabela **`campaigns`** (já existente no MVP com `channel`, `description`, `is_active`) foi **estendida** para o edital de campanhas: **`context_markdown`** guarda o contexto da oferta em um único texto longo (Markdown aceito pelo produto); não foi normalizado em várias colunas (oferta, produto, período, etc.) neste passo para manter o MVP simples. **`generation_prompt`** armazena o prompt-base (persona, tom, formato; placeholders para campos do lead serão substituídos na Edge Function). **`trigger_stage_id`** referencia opcionalmente uma etapa do funil do mesmo `workspace_id` para futura automação ao mudar de etapa. **`created_by`** referencia `auth.users` quando o cliente preencher na criação. A tabela **`lead_message_suggestions`** passou a incluir **`source`** (`manual` | `auto_trigger`) e RLS vinculada ao workspace do lead (acesso apenas para membros do workspace relacionado ao `lead_id`). No front, **`/settings/campaigns`** lista campanhas do workspace atual (via `localStorage`), com formulários em **nova** e **`/[id]`** para textos longos, canal, ativo/inativo e select de etapa gatilho **desabilitado** (UX “em breve”) até a branch que ligar a automação.

### Como estruturou a integração com LLM

Chaves e escolha de modelo ficam **somente no servidor**: secrets **`LLM_PROVIDER`**, **`LLM_MODEL`** e **`LLM_API_KEY`** documentados em **`supabase/.env.example`** e aplicados via **`supabase secrets set`** (ou painel do projeto). O front Next **não** recebe `LLM_API_KEY`. A função **`supabase/functions/campaign-generation/`** (Deno 2, `deno.json` por função) foi implementada como endpoint `POST` com validação de JWT, checagem de membership por workspace, carga de campanha+lead+campos custom e chamada ao Google Gemini com saída JSON `{ "messages": string[] }` (2–3 mensagens).

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
- **Onboarding de workspace com criação/seleção real:** era necessário transformar a tela estática em fluxo funcional sem convites nesta etapa. **Solução:** `/onboarding/workspace` agora lista workspaces do usuário via `workspace_members`, resolve nomes via tabela `workspaces`, permite selecionar um existente e criar novo via RPC `create_workspace_with_owner`, persistindo o workspace escolhido no browser.
- **Erros de permissão na RPC de criação de workspace:** durante o onboarding ocorreram respostas `403` no endpoint `rpc/create_workspace_with_owner`. **Solução:** migrations adicionais com grants para role `authenticated`, ajuste da função para `security definer`, `grant execute` explícito e policy de leitura de `workspaces` por membership.
- **Navegação e UX do onboarding de workspace:** era necessário alinhar comportamento de logos e pós-criação. **Solução:** logos clicáveis redirecionam para `/`, criação de workspace não redireciona automaticamente e atualiza a lista local com o item recém-criado; a continuidade acontece ao selecionar um workspace.
- **Etapas padrão do funil para novos workspaces:** era necessário que cada workspace novo já começasse com um pipeline utilizável sem intervenção manual. **Solução:** migration com função + trigger em `workspaces` para criar automaticamente `Base`, `Lead Mapeado`, `Tentando Contato`, `Conexão Iniciada`, `Desqualificado`, `Qualificado` e `Reunião Agendada`, com `position` sequencial e backfill para workspaces já existentes.
- **Gestão de campos customizados do lead por workspace:** era necessário permitir configuração dinâmica de dados do lead sem alterar schema a cada novo campo de negócio. **Solução:** tabela `lead_custom_field_definitions` com unicidade de `key` por workspace e RLS, além de UI em `/settings/lead-fields` para criar, editar e remover (`key`, `label`, `type`).
- **Edição detalhada de lead com campos dinâmicos:** era necessário centralizar edição de dados padrão e customizados em uma única tela com feedback de persistência. **Solução:** rota `/leads/[id]` com seções de dados padrão, custom fields (a partir de `lead_custom_field_definitions`), responsável (membros do workspace) e observações, salvando em `leads` com mensagens de sucesso/erro.
- **Movimentação visual de leads no pipeline:** era necessário manipular avanço de lead por etapa diretamente no board com feedback imediato. **Solução:** dashboard em formato Kanban com `@hello-pangea/dnd`, atualização otimista de `stage_id` no drop e rollback da UI quando a persistência falha.
- **Usabilidade do board para operação diária:** faltavam estados de carregamento, vazio e criação rápida para tornar o Kanban realmente utilizável sem atalhos manuais. **Solução:** busca por nome no board, empty states com CTA para primeiro lead, skeletons de loading e habilitação do botão `Novo lead` com criação direta na etapa inicial.
- **Escalabilidade visual do board em diferentes telas:** com mais leads por coluna, a página ficava excessivamente longa e difícil de operar em resoluções menores. **Solução:** formulário de criação ajustado para responsividade mobile/tablet/desktop e colunas do Kanban com scroll interno a partir de um limite de altura.
- **Campos obrigatórios por etapa do funil:** era necessário preparar a base para regras de transição exigindo preenchimento de campos por estágio. **Solução:** schema `stage_required_fields` com `field_kind` (`standard` | `custom`), constraints e RLS herdando workspace via `funnel_stages`.
- **Transição de etapa com garantia transacional:** o drag and drop do board precisava validar pré-condições no servidor para evitar movimentações inválidas entre colunas. **Solução:** RPC atômica `transition_lead_stage_atomic` que valida membership, requisitos da etapa destino, monta snapshot do lead e só persiste `stage_id` quando tudo é válido; em erro, retorna payload com campos faltantes e o Kanban reverte a UI.
- **Governança de obrigatoriedade por etapa no próprio produto:** faltava uma interface para o admin configurar regras sem SQL manual. **Solução:** tela `/settings/stage-required-fields` para `owner/admin` gerenciar `stage_required_fields` por etapa e aplicar preset “Lead Mapeado” com um clique.
- **Criação rápida de lead ignorando regras da etapa inicial:** o lead entrava no board sem dados exigidos pela RPC de transição, gerando erro só ao arrastar. **Solução:** carregar `stage_required_fields` da primeira etapa ao abrir o formulário, exibir inputs extras alinhados às regras e validar com o mesmo critério da RPC antes do `insert` em `leads`.

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
- [x] Onboarding de workspace com criação via RPC e seleção de workspace existente (sem convites nesta branch)
- [x] Migrations de grants/policies para estabilizar RPC de criação de workspace no Supabase local
- [x] Criação de workspace sem redirect automático, com atualização imediata da lista
- [x] Seed automático de etapas padrão do funil para cada workspace
- [x] Logos do header/onboarding redirecionando para `/`
- [x] Configuração de campos customizados do lead por workspace (`/settings/lead-fields`)
- [x] Página de detalhe/edição de lead com seções e salvamento (`/leads/[id]`)
- [x] Board Kanban no dashboard com drag and drop e persistência de `stage_id`
- [x] Board com busca por nome, empty states, skeletons e criação rápida de lead
- [x] Ajustes responsivos do formulário de criação e scroll interno por coluna no Kanban
- [x] Schema `stage_required_fields` com enum e RLS via vínculo de etapa/workspace
- [x] Operação atômica de transição de etapa com validação de campos obrigatórios
- [x] Tela de administração de obrigatoriedades por etapa com preset sugerido
- [x] Validação na criação rápida de lead conforme obrigatoriedades da etapa inicial (evita lead “preso” no board)
- [x] Mensagens de campos obrigatórios no Kanban com rótulos legíveis (ex.: LinkedIn, Cargo) em vez de chaves técnicas
- [x] Telas `/settings/lead-fields` e `/settings/stage-required-fields` com rótulos e textos para perfil não técnico
- [x] Página `/leads/[id]`: campo custom booleano com layout responsivo, hierarquia clara e bloco compacto (`max-w-sm`) para menos deslocamento do mouse
- [x] Schema `campaigns` estendido (`context_markdown`, `generation_prompt`, `trigger_stage_id`, `created_by`) alinhado ao edital; RLS existente por workspace
- [x] Pasta `supabase/functions` com `campaign-generation` (Deno + `deno.json`) e documentação de secrets `LLM_*`
- [x] `campaign-generation` com JWT + membership + prompt estruturado e geração via Gemini retornando `{ "messages": string[] }`
- [x] Telas de campanhas: lista, criação e edição em `/settings/campaigns` (contexto Markdown, prompt, toggle ativo; etapa gatilho só leitura/desabilitada até automação)
- [x] `lead_message_suggestions` com `source` (`manual` | `auto_trigger`) e RLS validada pelo workspace do lead
- [x] `/leads/[id]` com seletor de campanha ativa, botões Gerar/Regenerar, histórico de sugestões em cards e botão Copiar com toast
- [ ] Telas de negócio SDR (cadastros, pipeline, tarefas)
- [ ] Integração com LLM (expandir fluxos de geração e automação por gatilho de etapa)

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

### Secrets para Edge Functions (LLM)

Variáveis **`LLM_PROVIDER`**, **`LLM_MODEL`** e **`LLM_API_KEY`** servem às **Supabase Edge Functions** (ex.: `campaign-generation`), **não** ao `web/.env.local`. Exemplo sem valores reais: **`supabase/.env.example`**. Copie para um arquivo local (por exemplo `supabase/.env`, ignorado pelo git) e use `npx supabase@latest secrets set --env-file supabase/.env` com o projeto linkado, ou configure no painel em **Edge Functions → Secrets**.

Para produção, publique as chaves como secrets:

```bash
npx supabase@latest secrets set --env-file supabase/.env
```

Nunca commite chaves reais (`LLM_API_KEY`, tokens, credenciais). Consulte a seção homônima em `supabase/README.md`.

### Scripts úteis (`web/`)

| Comando | Descrição |
|--------|------------|
| `npm run dev` | Next.js em modo desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

### Pastas

- `web/` — Next.js App Router (TypeScript, tema, cliente Supabase no browser)
- `supabase/` — config, migrações do Supabase e **Edge Functions** em `supabase/functions/` (dev local com Docker)
- `roadmap/` — registro incremental do que foi entregue
