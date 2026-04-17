# 52 — Garantia de índice `leads(workspace_id, stage_id)`

## Entrega

- Migration `supabase/migrations/20260417190000_ensure_leads_workspace_stage_index.sql` com:
  - `create index if not exists idx_leads_workspace_stage_id on public.leads (workspace_id, stage_id);`

## Motivo

- O board Kanban e os resumos por etapa filtram leads por workspace e estágio; o índice composto mantém esse caminho de consulta eficiente com aumento de dados.

## Documentação

- `README.md` atualizado em desafios e checklist.
- `supabase/README.md` com seção de índice de performance para board por etapa.
