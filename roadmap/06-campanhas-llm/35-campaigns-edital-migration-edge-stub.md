# 35 — Campanhas (edital): colunas no banco, RLS herdado, Edge stub e secrets LLM

## Contexto

Edital pedia modelo de campanha por workspace com contexto da oferta, prompt de geração, etapa gatilho opcional, flag ativa e preparação para LLM em Edge Function sem expor chave no browser.

## O que foi feito

- Migração `supabase/migrations/20260417090000_campaigns_edital_context_prompt_trigger.sql` alterando `public.campaigns` (tabela já criada no MVP): colunas `context_markdown`, `generation_prompt` (default `''`), `trigger_stage_id` com FK composta para `funnel_stages(id, workspace_id)` ON DELETE SET NULL, `created_by` → `auth.users`, índice parcial por workspace + etapa. RLS e grants da migração MVP de `campaigns` permanecem.
- Decisão de produto documentada no README: **um campo** `context_markdown` para contexto da oferta no MVP; `channel`/`description` mantidos por compatibilidade com `lead_message_suggestions`.
- `supabase/functions/campaign-generation/index.ts` + `deno.json` (stub que retorna 503 se faltar secret).
- `supabase/.env.example` com `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`; `supabase/.gitignore` passa a ignorar `.env`.
- Documentação em `README.md`, `supabase/README.md`, `web/README.md`; tipos em `web/src/lib/supabase/database.types.ts` para `campaigns`.

## Resultado

Schema e tooling prontos para UI de campanhas e implementação futura da chamada ao provedor na função.
