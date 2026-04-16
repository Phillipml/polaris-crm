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

| Variável | Descrição |
|----------|-----------|
| `LLM_PROVIDER` | Provedor (`openai`, `anthropic`, `google`, …). |
| `LLM_MODEL` | Id do modelo (ex.: `gpt-4o-mini`, `claude-3-5-haiku-latest`, `gemini-2.0-flash`). |
| `LLM_API_KEY` | Chave do provedor. |

### Rodar localmente

```bash
npx supabase@latest functions serve campaign-generation
```

## Parar o ambiente local

```bash
npx supabase@latest stop
```
