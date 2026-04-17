# 84 — Reordenação em duas fases, slug dedupe e remover etapa de sistema

## Problemas

1. **409 em `reorder_funnel_stages`:** a constraint `unique (workspace_id, position)` quebrava ao atualizar todas as posições num único `UPDATE`, por ordem de aplicação das linhas gerar posições duplicadas momentaneamente.
2. **400 em `delete_funnel_stage`:** tentativa de remover etapa com `is_system = true` gerava exceção `system_stage_cannot_be_deleted`; o botão **Remover** seguia habilitado para essas etapas.
3. **Slug duplicado:** `create_funnel_stage` / `update_funnel_stage_name` podiam gerar o mesmo `slug` para nomes distintos e violar `funnel_stages_workspace_slug_unique`.

## Solução

- Nova migração `20260419130000_funnel_stages_reorder_two_phase_slug_dedupe.sql`: `reorder_funnel_stages` primeiro define `position = -ordem` (valores temporários únicos), depois aplica as posições finais positivas; `create_funnel_stage` e `update_funnel_stage_name` fazem loop de sufixo `_1`, `_2`… até slug livre no workspace.
- UI `settings/funnel-stages`: **Remover** desabilitado para `is_system` com `title` explicativo.
- `delete_funnel_stage` no cliente envia `p_reallocate_to_stage_id: null` quando não há realocação (evita string vazia).

## Deploy

`npx supabase@latest db push` no projeto linkado.
