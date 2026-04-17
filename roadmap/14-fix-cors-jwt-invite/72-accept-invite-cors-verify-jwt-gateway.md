# 72 - accept-invite: CORS e verify_jwt no gateway

## Contexto

Chamadas a `functions/v1/accept-invite` a partir do app na Vercel falhavam no navegador com erro de CORS no preflight: a resposta ao OPTIONS não era HTTP OK.

## Causa raiz

Com `verify_jwt = true` no gateway do Supabase, a validação de JWT ocorre antes do handler Deno. O preflight OPTIONS não envia cabeçalho `Authorization`, o que impedia o fluxo CORS correto para invocação via `supabase.functions.invoke` no browser.

## Ações implementadas

- `supabase/config.toml`: `verify_jwt = false` para `[functions.accept-invite]`.
- `supabase/functions/accept-invite/index.ts`: inclusão de `Access-Control-Allow-Methods: POST, OPTIONS` nos cabeçalhos CORS (o handler já respondia OPTIONS com 204 e validava POST com Bearer).
- Documentação em `supabase/README.md` e bullet correspondente em `README.md` (desafios).

## Deploy necessário

Após puxar as alterações, publicar a função no projeto remoto:

`npx supabase@latest functions deploy accept-invite`

## Resultado

O convite pode ser aceito a partir do domínio de produção sem bloqueio de CORS no preflight, mantendo exigência de sessão válida no corpo da requisição POST.
