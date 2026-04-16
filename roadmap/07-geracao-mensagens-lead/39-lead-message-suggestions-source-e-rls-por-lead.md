# 39 — lead_message_suggestions: source e RLS por workspace do lead

## O que foi feito

- Migration `supabase/migrations/20260417110000_lead_message_suggestions_source_and_rls.sql`.
- `lead_message_suggestions` recebeu coluna `source` (`manual` | `auto_trigger`) com `default 'manual'` e constraint de domínio.
- Políticas RLS de `lead_message_suggestions` foram recriadas para `select/insert/update/delete` usando validação por `lead_id` no `workspace_id` correspondente e `is_workspace_member`.
- Tipos atualizados em `web/src/lib/supabase/database.types.ts` para incluir tabela `lead_message_suggestions` com enum de `source`.
- README atualizado com a decisão de modelagem e checklist da funcionalidade.

## Resultado

- Persistência de sugestões agora distingue origem manual e automática.
- Acesso fica restrito ao contexto do lead/workspace, reduzindo risco de vazamento cross-tenant.
