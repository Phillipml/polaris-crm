# 21 - Serviços e hooks de leads por workspace e stage

## Ação realizada

Foi adicionada uma camada de dados para `leads` no front-end, tipada em TypeScript com base no client do Supabase.

Foram incluídos:

- `src/lib/supabase/database.types.ts` com tipagem manual da tabela `leads`
- atualização de `src/lib/supabase/browser-client.ts` para `SupabaseClient<Database>`
- `src/lib/leads/leads-service.ts` com operações:
  - listagem por `workspace_id` e opcionalmente por `stage_id`
  - criação de lead
  - atualização de lead
- `src/hooks/use-leads.ts` com hooks:
  - `useLeads`
  - `useCreateLead`
  - `useUpdateLead`

O `README` do `web/` também foi atualizado para registrar os novos diretórios `hooks/` e `lib/leads/`.
