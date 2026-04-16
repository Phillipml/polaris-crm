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

## Parar o ambiente local

```bash
npx supabase@latest stop
```
