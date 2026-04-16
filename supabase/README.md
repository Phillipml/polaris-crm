# Supabase (desenvolvimento local)

Este diretório foi criado com **`npx supabase init`** na raiz do repositório. A stack local (Postgres, Auth, Storage, Studio, etc.) roda via **Docker** quando você executa `supabase start`.

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) em execução
- Opcional: [Supabase CLI](https://supabase.com/docs/guides/cli) instalada globalmente; senão use **`npx supabase@latest`** nos comandos abaixo

## Subir o ambiente local

Na **raiz** do repositório (`polaris-crm/`):

```bash
npx supabase@latest start
```

Aguarde os containers ficarem saudáveis. Para ver **Project URL** e chaves (incluindo a **Publishable key**, usada no front):

```bash
npx supabase@latest status
```

- **Project URL** típico: `http://127.0.0.1:54321` (porta padrão definida em `supabase/config.toml`, chave `[api] port`)
- Copie o valor **Publishable key** para `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no `web/.env.local`

## Frontend (`web/`) em dev

1. Com o stack local rodando, execute `npx supabase@latest status`.
2. Em `web/.env.local` (crie a partir de `web/.env.example`), use:

   - `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` (ou o Project URL exibido em `status`)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Publishable key do status>`

3. Reinicie `npm run dev` na pasta `web/`.

O cliente em `web/src/lib/supabase/browser-client.ts` lê apenas essas variáveis `NEXT_PUBLIC_*`.

## E-mails de autenticação no ambiente local

No ambiente local, os e-mails (confirmação de cadastro, recuperação de senha etc.) não são enviados para caixa real. Eles ficam no Inbucket, disponível em:

- `http://127.0.0.1:54324`

Neste projeto, as confirmações de e-mail estão habilitadas em `supabase/config.toml` (`[auth.email] enable_confirmations = true`), então após cadastro o usuário deve receber o e-mail no Inbucket.

### Recuperação de senha não “chega” no Gmail

1. Confirme que está usando o **Supabase local** (`NEXT_PUBLIC_SUPABASE_URL` apontando para `127.0.0.1` ou `localhost`) e que o stack está de pé (`npx supabase@latest start`).
2. Abra o **Inbucket** (`http://127.0.0.1:54324`) e procure o e-mail de reset; ele não vai para o provedor externo.
3. O link do e-mail (se o usuário clicar) redireciona para `redirectTo` configurado no app. Neste repositório o fluxo principal de recuperação é **`/forgot-password`** (código na mesma página); o link também aponta para essa URL. A rota `/auth/reset-password` só redireciona para `/forgot-password` mantendo o hash. Em `supabase/config.toml`, `additional_redirect_urls` inclui `forgot-password` e `auth/reset-password` em `localhost` e `127.0.0.1`.
4. Após alterar `config.toml`, reinicie os containers: `npx supabase@latest stop` e `npx supabase@latest start`.

Em **projeto hospedado** no Supabase, é preciso configurar **SMTP** (ou o provedor de e-mail padrão do painel) em **Authentication → Emails**; caso contrário, o reset pode não ser entregue como esperado.

No painel remoto, em **Authentication → URL configuration**, inclua na lista de **Redirect URLs** os endereços da sua app com o caminho `/auth/reset-password` (por exemplo `https://seu-dominio.com/auth/reset-password` e `http://localhost:3000/auth/reset-password` em dev contra o projeto remoto).

Em **Authentication → Providers → Email** (ou políticas de senha no painel, conforme a versão), alinhe requisitos de senha ao app: neste repositório o front valida **8+ caracteres** com **maiúscula, minúscula, número e caractere especial**, e o `config.toml` local usa `minimum_password_length = 8` e `password_requirements = "lower_upper_letters_digits_symbols"` para aproximar a mesma regra no Auth.

### E-mail de recuperação só com código (sem link)

No ambiente local, o template de recuperação está em `supabase/templates/recovery.html` e referenciado em `supabase/config.toml` em `[auth.email.template.recovery]`.

O `content_path` é resolvido em relação à **raiz do repositório** (pasta de onde você roda `npx supabase start` / `stop`), não em relação ao arquivo `config.toml`. Use `./supabase/templates/recovery.html` para que o arquivo seja encontrado no Windows e em outros SO.

O corpo está em **português**, com logo em `{{ .SiteURL }}/logoFull.svg` (o `site_url` do Auth deve ser a URL da app onde o Next serve `public/logoFull.svg`) e o código em `{{ .Token }}` (6 dígitos), sem `{{ .ConfirmationURL }}`, alinhado ao fluxo em `/forgot-password`.

No **projeto hospedado**, copie o HTML e o assunto para **Authentication → Email Templates → Reset password** (ou equivalente) no painel do Supabase, pois o `config.toml` não aplica templates automaticamente na nuvem.

### Workspace onboarding (RPC e permissões)

O fluxo de onboarding usa a função `public.create_workspace_with_owner(workspace_name text)` para criar workspace e membership `owner` na mesma operação.

Caso apareça `403 Forbidden` ao chamar `rpc/create_workspace_with_owner`, confirme que as migrations abaixo foram aplicadas no local:

- `20260416023000_workspaces_and_memberships_rls.sql`
- `20260416031500_workspace_grants_authenticated.sql`
- `20260416033000_fix_workspace_rpc_security_and_select_policy.sql`

Com o stack local ativo:

```bash
npx supabase@latest migration list --local
npx supabase@latest db push --local
```

## Migrações

### Criar uma nova migração (arquivo SQL vazio para você editar)

```bash
npx supabase@latest migration new nome_descritivo
```

Isso gera algo como `supabase/migrations/<timestamp>_nome_descritivo.sql`.

### Aplicar migrações no Postgres local

Com **`supabase start`** já rodando:

```bash
npx supabase@latest db reset
```

Isso recria o banco local, aplica **todas** as migrações em ordem e executa `supabase/seed.sql` (configurado em `config.toml` → `[db.seed]`).

Para aplicar só migrações pendentes sem reset completo (quando suportado pelo CLI na sua versão):

```bash
npx supabase@latest migration up
```

> A primeira migração do repo (`*_initial.sql`) é intencionalmente **vazia** de DDL de negócio: serve de baseline até o modelo SDR ser definido.

## Ligar a um projeto remoto (opcional)

1. Login:

   ```bash
   npx supabase@latest login
   ```

2. Associar o diretório ao projeto (ref no dashboard: **Project Settings → General → Reference ID**):

   ```bash
   npx supabase@latest link --project-ref <seu-project-ref>
   ```

3. Fluxos comuns após o link:
   - **`npx supabase@latest db pull`** — trazer schema remoto para migrações declarativas (conforme fluxo que você adotar)
   - **`npx supabase@latest db push`** — enviar migrações locais para o projeto linkado (cuidado em produção; use branches/preview quando disponível)

Consulte a [documentação oficial](https://supabase.com/docs/guides/cli) para flags e ambientes (staging/prod).

## Edge Functions (Deno)

Funções ficam em `supabase/functions/<nome>/` com `index.ts` e, por função, um `deno.json` (compiler strict, libs Deno), alinhado ao runtime em `config.toml` (`[edge_runtime]`, `deno_version`).

### Função de exemplo: `campaign-generation`

Endpoint HTTP `POST` para gerar mensagens a partir de campanha e lead.

Payload:

```json
{ "campaign_id": "<uuid>", "lead_id": "<uuid>" }
```

Fluxo:

- valida JWT do Supabase (`Authorization: Bearer <token>`)
- resolve `workspace_id` via lead e valida membership (`workspace_members`)
- carrega campanha + lead + definições de campos customizados
- monta prompt em seções `CONTEXTO`, `INSTRUCOES`, `DADOS DO LEAD`
- chama Google Gemini e força resposta JSON `{ "messages": string[] }` com 2–3 itens
- responde `401`, `403`, `404` conforme cenário de auth/autorização/registro ausente

### Secrets `LLM_*` (servidor apenas)

Não use essas chaves no app Next (`NEXT_PUBLIC_*`). Exemplo de nomes e formato está em **`supabase/.env.example`** (valores fictícios; não commitar chave real).

Para ambiente linkado ou produção:

```bash
npx supabase@latest secrets set --env-file supabase/.env
```

(Use um arquivo local ignorado pelo git, por exemplo `supabase/.env`, copiado do `.env.example`.) No painel: **Project Settings → Edge Functions → Secrets**.

Nunca commite chaves reais (`LLM_API_KEY`, tokens, credenciais). Mantenha apenas placeholders em arquivos versionados como `supabase/.env.example`.

| Variável | Descrição |
|----------|-----------|
| `LLM_PROVIDER` | Provedor (`openai`, `anthropic`, `google`, …). |
| `LLM_MODEL` | Id do modelo (ex.: `gpt-4o-mini`, `claude-3-5-haiku-latest`, `gemini-2.0-flash`). |
| `LLM_API_KEY` | Chave do provedor. |

### Rodar localmente

```bash
npx supabase@latest functions serve campaign-generation
```

## Destino HTTP do Database Webhook — `lead-stage-webhook`

Esta Edge é o **endpoint HTTP** configurado no **Database Webhook** (ou chamado pelo trigger `pg_net` opcional). Ela recebe o payload, extrai **`record.id` → `lead_id`** e **`record.stage_id` → `new_stage_id`** (e `old_record.stage_id` como estágio anterior), busca campanhas **`is_active = true`** com **`trigger_stage_id = new_stage_id`** e, para cada campanha, executa geração (Gemini) e persiste **`lead_message_suggestions`** com **`source = auto_trigger`**.

### Regra exata de disparo

- **Fonte oficial do evento:** `UPDATE` na tabela `public.leads`.
- **Condição para processar:** `NEW.stage_id IS DISTINCT FROM OLD.stage_id` (ignora updates que não mudam estágio, inclusive quando outros campos mudam).
- **INSERT:** não dispara este pipeline (o lead nasce já em uma etapa; não há “transição” de estágio anterior). Use geração manual ou outro fluxo se precisar de conteúdo na criação.

### Duas formas de entrega (use só uma em produção para evitar duplicidade)

1. **Database Webhook (painel Supabase)** em `public.leads` → evento **UPDATE** → `POST` na Edge `lead-stage-webhook` com header **`X-Webhook-Secret`** igual ao secret configurado na Edge (`LEAD_STAGE_WEBHOOK_SECRET`). Filtre no painel, quando disponível, para payloads em que `record.stage_id` difere de `old_record.stage_id`.
2. **Trigger opcional com `pg_net` (migration `20260417140000`, chaves renomeadas na `20260417160000`)** que chama a mesma URL quando `public.app_runtime_config` tiver **`lead_stage_webhook_url`** e **`lead_stage_webhook_secret`** preenchidos. Com secret vazio, o trigger **não** envia HTTP (no-op).

### Segurança na Edge

- A função compara **`X-Webhook-Secret`** com a variável de ambiente **`LEAD_STAGE_WEBHOOK_SECRET`** (via `supabase secrets set`). Sem match → **401** (header ausente) ou **403** (valor inválido). Não hardcode segredo no repositório.

### Idempotência (estratégia de “rodada”)

- Tabela `public.lead_stage_webhook_campaign_dedupe` com chave primária **`(lead_id, campaign_id, old_stage_id, new_stage_id, leads_updated_at)`**, onde **`leads_updated_at` é o `updated_at` do lead após o `UPDATE` commitado** (mesma “rodada” = mesma transição no banco). Isso evita duas gerações idênticas para o mesmo **lead + campanha + transição + instante de commit** quando o provedor reentrega o webhook ou há trigger + webhook em paralelo.
- Se o lead voltar a cruzar a mesma aresta de funil mais tarde, **`leads.updated_at` muda**, portanto **uma nova rodada** pode gerar de novo (comportamento desejado frente a um PK só com estágios).
- A unicidade **`(lead_id, campaign_id, variant_index)`** em `lead_message_suggestions` continua garantindo que não haja colisão de variantes dentro da mesma campanha.
- Se a geração LLM ou o insert em `lead_message_suggestions` falhar após marcar dedupe, a Edge remove a linha de dedupe daquela campanha **e daquele `leads_updated_at`** para permitir retry.

### Semântica de commit e observabilidade

- O **`UPDATE` do lead já foi commitado** antes do webhook/HTTP retornar. Se a Edge falhar, o estágio **permanece alterado**; o retry depende do provedor (Database Webhook no painel costuma ter tentativas; `pg_net` expõe fila/respostas em `net._http_response` / `net.http_request_queue` conforme versão).
- Logs: **Supabase Dashboard → Edge Functions → Logs** para `lead-stage-webhook`; entregas do Database Webhook no painel de Database Webhooks; no local, terminal do `functions serve`.

### Matching de campanhas

- A Edge só gera automaticamente para campanhas **`is_active = true`** e **`trigger_stage_id` igual ao novo `stage_id`** do lead. Para testar no Kanban, defina `trigger_stage_id` da campanha para a etapa de destino (via SQL no demo ou UI quando existir).

### Acompanhamento na UI (`generation_jobs`)

- Tabela **`public.generation_jobs`**: ao iniciar o processamento com campanhas a gerar, a Edge insere **`status = pending`** (no máximo um pendente por `lead_id`); ao terminar com sucesso marca **`completed`**, em erro **`failed`**. Membros do workspace podem **`select`** para a tela **`/leads/[id]`** fazer polling e exibir o badge “Gerando sugestões…”.

### Secrets adicionais

| Variável | Descrição |
|----------|-----------|
| `LEAD_STAGE_WEBHOOK_SECRET` | Segredo compartilhado entre Database Webhook (header) e Edge. |

### Rodar a Edge localmente

```bash
npx supabase@latest functions serve lead-stage-webhook
```

## Parar o ambiente local

```bash
npx supabase@latest stop
```
