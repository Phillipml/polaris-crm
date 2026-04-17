# 48 — Supabase local + LLM (Groq no fluxo original)

## Entrega

- Ambiente local da Edge alinhado com `supabase/functions/.env` para `LLM_*` e `LEAD_STAGE_WEBHOOK_SECRET`, com ciclo `stop/start` quando houver mudança.
- Gateway das functions ajustado com `verify_jwt = false` para `campaign-generation` e `lead-stage-webhook`, mantendo validação de seguranca dentro das funções.
- Diagnóstico melhor de `missing_or_invalid_llm_config` e tratamento de erro do `invoke` no front para mostrar `error/detail` reais.
- Suporte a `LLM_PROVIDER` (`google` e `groq`) via módulo compartilhado.
- Fluxo original desta etapa foi feito com Groq (`LLM_PROVIDER=groq`) e depois mantido compatível com Gemini.
- No gatilho local com `pg_net`, `lead_stage_webhook_secret` em `app_runtime_config` deve bater com o valor do `.env`; sem isso não há POST automático para a Edge.

## Escopo de commit sugerido

- `supabase/config.toml`
- `supabase/.env.example`
- `supabase/functions/.env.example`
- `supabase/functions/_shared/llm-messages.ts`
- `supabase/functions/campaign-generation/index.ts`
- `supabase/functions/lead-stage-webhook/index.ts`
- `web/src/lib/lead-message-suggestions/lead-message-suggestions-service.ts`
- `supabase/README.md`
- `README.md`
