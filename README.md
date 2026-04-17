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

A tabela **`lead_activities`** registra eventos de auditoria por lead (`type` em `stage_changed`, `fields_updated`, `outreach_sent`, `payload` em JSONB, `created_by`, `created_at`), com FK composta ao lead (`lead_id`, `workspace_id`) e RLS por membro do workspace. Mudanças de **`stage_id`** são gravadas por trigger em `AFTER UPDATE` em `leads`; edições de campos principais e envio simulado são inseridas pela camada da aplicação após `update` bem-sucedido ou após o fluxo de outreach, para payloads ricos sem duplicar lógica de diff no banco.

A tabela **`campaigns`** (já existente no MVP com `channel`, `description`, `is_active`) foi **estendida** para o edital de campanhas: **`context_markdown`** guarda o contexto da oferta em um único texto longo (Markdown aceito pelo produto); não foi normalizado em várias colunas (oferta, produto, período, etc.) neste passo para manter o MVP simples. **`generation_prompt`** armazena o prompt-base (persona, tom, formato; placeholders para campos do lead serão substituídos na Edge Function). **`trigger_stage_id`** referencia opcionalmente uma etapa do funil do mesmo `workspace_id` para futura automação ao mudar de etapa. **`created_by`** referencia `auth.users` quando o cliente preencher na criação. A tabela **`lead_message_suggestions`** passou a incluir **`source`** (`manual` | `auto_trigger`) e RLS vinculada ao workspace do lead (acesso apenas para membros do workspace relacionado ao `lead_id`). No front, **`/settings/campaigns`** lista campanhas do workspace atual (via `localStorage`), com formulários em **nova** e **`/[id]`** para textos longos, canal, ativo/inativo e **select de etapa gatilho** (`trigger_stage_id`) alinhado às etapas do funil do workspace.

### Como estruturou a integração com LLM

Chaves e escolha de modelo ficam **somente no servidor**: secrets **`LLM_PROVIDER`**, **`LLM_MODEL`** e **`LLM_API_KEY`** documentados em **`supabase/.env.example`** e aplicados via **`supabase secrets set`** (ou painel do projeto). O front Next **não** recebe `LLM_API_KEY`. O provedor pode ser **`google`** (Gemini, `generativelanguage.googleapis.com`) ou **`groq`** (API compatível com OpenAI em `api.groq.com`, modelos tipo Llama/Mixtral conforme [documentação Groq](https://console.groq.com/docs/models)). A lógica comum de parsing e chamada HTTP vive em **`supabase/functions/_shared/llm-messages.ts`** e é usada por **`supabase/functions/campaign-generation/`** (endpoint `POST` com JWT, membership, carga de campanha+lead+campos custom) e por **`supabase/functions/lead-stage-webhook/`** (webhook de mudança de etapa). A saída esperada do LLM é JSON `{ "messages": string[] }` com 2–3 strings. O webhook persiste **`lead_message_suggestions`** com **`source = auto_trigger`** e deduplicação por **rodada** via **`leads.updated_at`** (ver `supabase/README.md`).

A tabela **`generation_jobs`** expõe **`pending` / `completed` / `failed`** por lead enquanto a Edge de webhook processa campanhas com geração automática, permitindo que **`/leads/[id]`** faça polling leve sem inferir estado só pelo histórico de sugestões; a mesma tela ainda mostra **última geração automática** derivada do **`created_at`** mais recente com **`source = auto_trigger`**.

### Como implementou o multi-tenancy

Foi implementada a base de **multi-tenancy por workspace** no Supabase:

- `workspaces`: entidade de tenant lógico (`id`, `name`, `created_at`).
- `workspace_members`: vínculo usuário-workspace com papel (`role`) e PK composta (`workspace_id`, `user_id`).
- `workspace_invites`: convites pendentes com `email`, `role` (`admin` ou `member`), `token` opaco, `expires_at`, `invited_by` e `accepted_at` quando utilizados.
- Leitura de equipe: qualquer membro do workspace pode `select` em `workspace_members` daquele workspace; alteração ou remoção de membros e gestão de convites ficam com `owner`/`admin` via RLS e funções `SECURITY DEFINER`.
- Criação do tenant: fluxo via RPC `create_workspace_with_owner(workspace_name)` para criar workspace + membership `owner` na mesma chamada.
- Convite: RPC `create_workspace_invite(workspace_id, email, role)` gera token e prazo; a Edge `accept-invite` (JWT obrigatório) valida token, expiração, igualdade do e-mail do convite com o usuário autenticado e insere o membership com `service_role`.

### Desafios encontrados e como resolveu

- **503 nas Edge Functions locais (`campaign-generation`):** o stack lê **`LLM_*`** a partir de **`supabase/functions/.env`** no `supabase start`; só manter `supabase/.env` ou rodar `functions serve` com `.env` incompleto recarregando o Kong gerava **`missing_supabase_env`** / **`missing_or_invalid_llm_config`**. **Solução:** copiar secrets para `supabase/functions/.env`, `stop`/`start` e evitar `functions serve` paralelo sem todas as variáveis; ver `supabase/README.md` e `roadmap/08-gatilho/61-supabase-local-edges-env-webhook-pgnet.md`.
- **502 / “Missing authorization header” na Edge (`campaign-generation`) e webhook de etapa:** o gateway padrão validava JWT na borda; GET na URL no navegador nunca envia Bearer, e o webhook usa **`X-Webhook-Secret`**. **Solução:** `verify_jwt = false` para essas funções em `supabase/config.toml`, mantendo validação dentro do handler; ver `supabase/README.md` e `roadmap/08-gatilho/61-supabase-local-edges-env-webhook-pgnet.md`.
- **“Edge Function returned a non-2xx status code” com corpo JSON ignorado:** o `supabase.functions.invoke` coloca `data` em `null` quando o status não é 2xx; o payload útil vem no corpo da `Response` em `FunctionsHttpError`. **Solução:** parse do JSON em `error.context` no serviço de sugestões e detalhes de erro da API do provedor LLM na Edge; ver `roadmap/08-gatilho/62-llm-multiprovider-e-ux-invoke-campaign-generation.md`.
- **429 / cota do Gemini (`llm_request_failed:429`):** a chave em **Google AI Studio** está sujeita a limites do plano gratuito e por modelo; a mensagem da API indica métricas esgotadas ou `limit: 0` quando não há cota disponível para aquele modelo. **Solução:** aguardar a janela de rate limit (se a mensagem pedir retry em segundos), ativar **billing** no projeto Google Cloud vinculado à API, ou trocar `LLM_MODEL` por um modelo com cota disponível na sua conta; acompanhar em [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) e no painel de uso. Ver `roadmap/08-gatilho/61-supabase-local-edges-env-webhook-pgnet.md`.
- **`missing_or_invalid_llm_config` (503) no local:** variáveis `LLM_*` não chegaram à Edge (arquivo errado, typo em `LLM_PROVIDER`, chave vazia). **Solução:** usar **`supabase/functions/.env`**, `LLM_PROVIDER` **`google`** ou **`groq`**, preencher `LLM_MODEL` e `LLM_API_KEY`, `stop`/`start`; a resposta JSON agora traz **`detail`** com flags de diagnóstico. Ver `supabase/README.md` e `roadmap/08-gatilho/62-llm-multiprovider-e-ux-invoke-campaign-generation.md`.
- **Typo `LM_PROVIDER` no `.env`:** sem o primeiro `L`, o Deno não define `LLM_PROVIDER` e a Edge acusa config inválida. **Solução:** renomear para **`LLM_PROVIDER`**. Ver `roadmap/08-gatilho/61-supabase-local-edges-env-webhook-pgnet.md`.
- **Gatilho de etapa no local sem sugestões automáticas:** o trigger `pg_net` existe, mas **`lead_stage_webhook_secret`** em `app_runtime_config` começa vazio — sem `UPDATE` alinhado ao `LEAD_STAGE_WEBHOOK_SECRET`, não há `POST` na Edge. **Solução:** SQL no Studio local conforme `supabase/README.md` (seção testes locais) e `roadmap/08-gatilho/61-supabase-local-edges-env-webhook-pgnet.md`.
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
- **Onboarding de workspace com criação/seleção real:** era necessário transformar a tela estática em fluxo funcional sem convites na primeira versão. **Solução:** `/onboarding/workspace` lista workspaces do usuário via `workspace_members`, resolve nomes em `workspaces`, permite selecionar um existente e criar novo via RPC `create_workspace_with_owner`, persistindo o workspace escolhido no browser.
- **Convites e papéis sem expor tokens a membros comuns:** era preciso permitir entrada de novos usuários no tenant sem abrir gestão de equipe a quem tem papel `member`. **Solução:** tabela `workspace_invites`, políticas que restringem convites a `owner`/`admin`, RPCs para criar convite e listar diretório com e-mail (join em `auth.users`), Edge `accept-invite` com validação de token e paridade de e-mail, rotas `/settings/workspace-members` e `/accept-invite`, e `login` aceitando `next` interno para retornar ao fluxo de aceite.
- **Erros de permissão na RPC de criação de workspace:** durante o onboarding ocorreram respostas `403` no endpoint `rpc/create_workspace_with_owner`. **Solução:** migrations adicionais com grants para role `authenticated`, ajuste da função para `security definer`, `grant execute` explícito e policy de leitura de `workspaces` por membership.
- **Métricas do dashboard por workspace com segurança de acesso:** era necessário consolidar contadores sem expor dados de outros workspaces. **Solução:** RPC `workspace_dashboard_stats(p_workspace uuid)` com `SECURITY DEFINER` e validação explícita de membership por `auth.uid()` + `workspace_members`, retornando total de leads, contagem por estágio (`jsonb`) e sugestões dos últimos 7 dias.
- **Navegação e UX do onboarding de workspace:** era necessário alinhar comportamento de logos e pós-criação. **Solução:** logos clicáveis redirecionam para `/`, criação de workspace não redireciona automaticamente e atualiza a lista local com o item recém-criado; a continuidade acontece ao selecionar um workspace.
- **Etapas padrão do funil para novos workspaces:** era necessário que cada workspace novo já começasse com um pipeline utilizável sem intervenção manual. **Solução:** migration com função + trigger em `workspaces` para criar automaticamente `Base`, `Lead Mapeado`, `Tentando Contato`, `Conexão Iniciada`, `Desqualificado`, `Qualificado` e `Reunião Agendada`, com `position` sequencial e backfill para workspaces já existentes.
- **Gestão de campos customizados do lead por workspace:** era necessário permitir configuração dinâmica de dados do lead sem alterar schema a cada novo campo de negócio. **Solução:** tabela `lead_custom_field_definitions` com unicidade de `key` por workspace e RLS, além de UI em `/settings/lead-fields` para criar, editar e remover (`key`, `label`, `type`).
- **Edição detalhada de lead com campos dinâmicos:** era necessário centralizar edição de dados padrão e customizados em uma única tela com feedback de persistência. **Solução:** rota `/leads/[id]` com seções de dados padrão, custom fields (a partir de `lead_custom_field_definitions`), responsável (membros do workspace) e observações, salvando em `leads` com mensagens de sucesso/erro.
- **Movimentação visual de leads no pipeline:** era necessário manipular avanço de lead por etapa diretamente no board com feedback imediato. **Solução:** dashboard em formato Kanban com `@hello-pangea/dnd`, atualização otimista de `stage_id` no drop e rollback da UI quando a persistência falha.
- **Consulta de leads por etapa em workspace com crescimento de volume:** o board e estatísticas dependem de filtros por `workspace_id` + `stage_id`. **Solução:** índice composto garantido em `leads(workspace_id, stage_id)` via migration idempotente para manter performance previsível.
- **Usabilidade do board para operação diária:** faltavam estados de carregamento, vazio e criação rápida para tornar o Kanban realmente utilizável sem atalhos manuais. **Solução:** busca por nome no board, empty states com CTA para primeiro lead, skeletons de loading e habilitação do botão `Novo lead` com criação direta na etapa inicial.
- **Visão executiva no dashboard sem perder fluxo operacional:** era necessário enxergar números por etapa sem sair da página do board. **Solução:** um card de total de leads, bloco de distribuição por estágio (barras) quando não há busca ativa, atalho para o Kanban e, durante a busca por nome, a distribuição some para priorizar o board e o card mostra apenas o total filtrado em relação ao workspace.
- **Escalabilidade visual do board em diferentes telas:** com mais leads por coluna, a página ficava excessivamente longa e difícil de operar em resoluções menores. **Solução:** formulário de criação ajustado para responsividade mobile/tablet/desktop, colunas do Kanban em grade (`grid-cols-2` no mobile e `lg:grid-cols-3` no desktop, padrão 2+2+2+1 e 3+3+1 para sete etapas) em vez de carrossel horizontal, e scroll interno por coluna a partir de um limite de altura.
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
- [x] Onboarding de workspace com criação via RPC e seleção de workspace existente
- [x] Convites (`workspace_invites`), RLS de admin para membros/convites, RPCs `create_workspace_invite` e `list_workspace_members_directory`, Edge `accept-invite`, UI `/settings/workspace-members` e `/accept-invite`
- [x] Remoção de workspace por owner via RPC segura (`delete_workspace_as_owner`) com ação na tela de onboarding
- [x] Migrations de grants/policies para estabilizar RPC de criação de workspace no Supabase local
- [x] Criação de workspace sem redirect automático, com atualização imediata da lista
- [x] RPC `workspace_dashboard_stats(p_workspace uuid)` para métricas do dashboard (total de leads, `stage_counts` por `stage_id` e total de sugestões em 7 dias) com `grant execute` para `authenticated` e validação de membership
- [x] Seed automático de etapas padrão do funil para cada workspace
- [x] Logos do header/onboarding redirecionando para `/`
- [x] Configuração de campos customizados do lead por workspace (`/settings/lead-fields`)
- [x] Página de detalhe/edição de lead com seções e salvamento (`/leads/[id]`)
- [x] Board Kanban no dashboard com drag and drop e persistência de `stage_id`
- [x] Índice composto garantido em `leads(workspace_id, stage_id)` para consultas por etapa no workspace
- [x] Board com barra de filtros (responsável, etapa e busca textual com debounce), consultas parametrizadas no Supabase, empty states, skeletons e criação rápida de lead
- [x] Dashboard com card de total, distribuição por barras (oculta durante busca por nome), link rápido para o Kanban
- [x] Dashboard secundário com taxa de conversão entre etapas selecionadas (fórmula explícita), série temporal de leads criados e contagem de mensagens por campanha
- [x] Dashboard secundário ocultado durante pesquisa textual para priorizar leitura do Kanban filtrado, com série temporal configurável em 7/14/30 dias
- [x] Ajustes responsivos do formulário de criação, grade responsiva das colunas do Kanban (sem scroll horizontal do board) e scroll interno por coluna
- [x] Schema `stage_required_fields` com enum e RLS via vínculo de etapa/workspace
- [x] Operação atômica de transição de etapa com validação de campos obrigatórios
- [x] Tela de administração de obrigatoriedades por etapa com preset sugerido
- [x] CRUD de etapas do funil com reorder (subir/descer) e remoção segura com realocação de leads em modal quando necessário
- [x] Validação na criação rápida de lead conforme obrigatoriedades da etapa inicial (evita lead “preso” no board)
- [x] Mensagens de campos obrigatórios no Kanban com rótulos legíveis (ex.: LinkedIn, Cargo) em vez de chaves técnicas
- [x] Telas `/settings/lead-fields` e `/settings/stage-required-fields` com rótulos e textos para perfil não técnico
- [x] Página `/leads/[id]`: campo custom booleano com layout responsivo, hierarquia clara e bloco compacto (`max-w-sm`) para menos deslocamento do mouse
- [x] Schema `campaigns` estendido (`context_markdown`, `generation_prompt`, `trigger_stage_id`, `created_by`) alinhado ao edital; RLS existente por workspace
- [x] Pasta `supabase/functions` com `campaign-generation` (Deno + `deno.json`) e documentação de secrets `LLM_*`
- [x] `campaign-generation` com JWT + membership + prompt estruturado e geração via **Gemini** ou **Groq** retornando `{ "messages": string[] }`
- [x] Edge `lead-stage-webhook` (destino HTTP do webhook ao mudar estágio do lead) com `X-Webhook-Secret`, dedupe por rodada (`lead_id`+`campaign_id`+`old_stage_id`+`new_stage_id`+`leads.updated_at`) e geração alinhada a `campaigns.trigger_stage_id`
- [x] Opcional: trigger `pg_net` após `UPDATE` em `leads` quando `stage_id` muda (desativado se secret/url vazios em `app_runtime_config`); documentação de Database Webhook no painel em `supabase/README.md`
- [x] Telas de campanhas: lista, criação e edição em `/settings/campaigns` (contexto Markdown, prompt, toggle ativo, select de etapa gatilho persistindo `trigger_stage_id`)
- [x] `lead_message_suggestions` com `source` (`manual` | `auto_trigger`) e RLS validada pelo workspace do lead
- [x] `/leads/[id]` com seletor de campanha ativa, botões Gerar/Regenerar, histórico de sugestões em cards e botão Copiar com toast
- [x] `/leads/[id]`: badge “Gerando sugestões…” com polling enquanto existir `generation_jobs` pendente (até 90s), linha “Última geração automática em …” a partir de `lead_message_suggestions.source = auto_trigger`
- [x] Botão Enviar em `/leads/[id]`: insert em `outreach_events` e transição para etapa `trying_contact`; em bloqueio por obrigatoriedades mostra orientação de preenchimento/ajuste no seed demo
- [x] `lead_activities` com trigger de mudança de etapa, registro de edição de campos no salvamento do lead, registro de envio simulado após outreach, e timeline em `/leads/[id]`
- [ ] Telas de negócio SDR (cadastros, pipeline, tarefas)
- [ ] Integração com LLM (expandir fluxos de geração e automação por gatilho de etapa)

---

## Anexo curto — matriz RLS (tabela x operação x policy)

| Tabela | Select | Insert | Update | Delete |
|--------|--------|--------|--------|--------|
| `workspaces` | `select workspaces where member` | `insert workspace as authenticated` | sem policy | sem policy |
| `workspace_members` | `workspace_members_select_workspace` | `workspace_members_insert_bootstrap_owner` | `workspace_members_update_admin` | `workspace_members_delete_admin` |
| `workspace_invites` | `workspace_invites_select_admin` | via RPC `SECURITY DEFINER` (`create_workspace_invite`) | sem policy | `workspace_invites_delete_admin` |
| `funnel_stages` | `funnel_stages_select` | `funnel_stages_insert` | `funnel_stages_update` | `funnel_stages_delete` |
| `leads` | `leads_select` | `leads_insert` | `leads_update` | `leads_delete` |
| `campaigns` | `campaigns_select` | `campaigns_insert` | `campaigns_update` | `campaigns_delete` |
| `lead_message_suggestions` | `lead_message_suggestions_select` | `lead_message_suggestions_insert` | `lead_message_suggestions_update` | `lead_message_suggestions_delete` |
| `lead_custom_field_definitions` | `lead_custom_field_definitions_select` | `lead_custom_field_definitions_insert` | `lead_custom_field_definitions_update` | `lead_custom_field_definitions_delete` |
| `stage_required_fields` | `stage_required_fields_select` | `stage_required_fields_insert` | `stage_required_fields_update` | `stage_required_fields_delete` |
| `outreach_events` | `outreach_events_select` | `outreach_events_insert` | `outreach_events_update` | `outreach_events_delete` |
| `generation_jobs` | `generation_jobs_select` | sem grant para `authenticated` | sem grant para `authenticated` | sem grant para `authenticated` |
| `lead_activities` | `lead_activities_select` | `lead_activities_insert` | sem grant para `authenticated` | sem grant para `authenticated` |
| `app_runtime_config` | sem grant para `authenticated` | sem grant para `authenticated` | sem grant para `authenticated` | sem grant para `authenticated` |
| `lead_stage_webhook_campaign_dedupe` | sem grant para `authenticated` | sem grant para `authenticated` | sem grant para `authenticated` | sem grant para `authenticated` |

### Teste de isolamento com dois usuários

- Script de smoke test: `supabase/snippets/rls_two_users_smoke_test.sql`.
- Objetivo: validar que usuário A só enxerga/escreve no workspace A e usuário B só no workspace B.
- Cobertura mínima no script: `leads` e `lead_activities` (leitura e tentativa de escrita cross-workspace).

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
