# 28 - RPC atômica de transição de etapa com validação de requisitos

## Ação realizada

Foi criada a operação transacional `transition_lead_stage_atomic` para substituir o update direto de `stage_id` no board.

A função implementa, na mesma transação:

- validação de sessão autenticada
- validação de membership no workspace
- busca e lock do lead (`FOR UPDATE`)
- validação da etapa de destino no mesmo workspace
- leitura dos requisitos de `stage_required_fields`
- montagem de snapshot do lead (campos padrão + `custom_fields`)
- retorno de erro (HTTP 400 via PostgREST) com payload contendo `missing_fields` quando inválido
- atualização de `stage_id` e retorno do lead atualizado quando válido

Também foi atualizado o Kanban para usar essa RPC no `onDragEnd`, com rollback de UI em falha e exibição amigável dos campos faltantes.

Arquivos principais:

- `supabase/migrations/20260416055000_rpc_transition_lead_stage_atomic.sql`
- `web/src/lib/leads/leads-service.ts`
- `web/src/app/dashboard/page.tsx`
