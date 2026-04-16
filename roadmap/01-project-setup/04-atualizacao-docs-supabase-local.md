# 04 — Atualização das documentações (Supabase local)

## O que foi feito

- Atualizado `web/README.md` para usar a terminologia atual da CLI do Supabase: **Publishable key** no lugar de **anon key**.
- Atualizado `supabase/README.md` para padronizar os termos **Project URL** e **Publishable key** no fluxo de configuração local.
- Atualizado `README.md` da raiz para deixar explícito que, no ambiente local, devem ser usados os valores de **Project URL** e **Publishable key** vindos de `npx supabase@latest status`.

## Objetivo da ação

Evitar ambiguidade entre nomenclaturas antigas e atuais da CLI do Supabase e facilitar a configuração correta do `web/.env.local` durante os testes locais.
