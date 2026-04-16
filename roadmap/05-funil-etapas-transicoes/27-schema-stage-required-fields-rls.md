# 27 - Schema `stage_required_fields` com RLS

## Ação realizada

Foi finalizado o schema de obrigatoriedade de campos por etapa com nova migration:

- `supabase/migrations/20260416054000_stage_required_fields_rls.sql`

Estrutura entregue:

- enum `public.stage_required_field_kind` com valores `standard` e `custom`
- tabela `public.stage_required_fields` com:
  - `stage_id`
  - `field_key`
  - `field_kind`
  - `created_at` e `updated_at`
- constraint de unicidade: `unique (stage_id, field_key, field_kind)`
- índices para `stage_id` e `field_kind`

Segurança:

- RLS habilitado na tabela
- policies de `SELECT`, `INSERT`, `UPDATE`, `DELETE` herdando permissão de workspace por join em `funnel_stages` + `is_workspace_member(fs.workspace_id)`

Validação:

- migration aplicada com sucesso via `npx supabase@latest db reset`.
