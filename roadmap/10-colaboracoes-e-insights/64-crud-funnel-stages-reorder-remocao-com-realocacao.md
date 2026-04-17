# 64 — CRUD de `funnel_stages` com reorder e remoção com realocação

## O que foi feito

- Migration `supabase/migrations/20260419001000_funnel_stages_crud_reorder_reallocate.sql` com RPCs:
  - `create_funnel_stage`;
  - `update_funnel_stage_name`;
  - `reorder_funnel_stages`;
  - `delete_funnel_stage` (impede remoção de etapa de sistema e da última etapa; exige realocação quando há leads).
- Serviço `web/src/lib/funnel-stages/funnel-stages-service.ts` expandido para CRUD/reorder e contagem de leads por etapa.
- Hooks em `web/src/hooks/use-funnel-stages.ts` para mutações e leitura de contagem por etapa.
- Nova tela `web/src/app/settings/funnel-stages/page.tsx` com:
  - criação;
  - renomeação;
  - reorder por botões subir/descer;
  - remoção via modal.
- Modal de remoção:
  - sem leads: permite remoção direta;
  - com leads: exige escolher etapa destino para realocação antes de remover.
- Navegação:
  - atalho para `Etapas do funil` no dashboard;
  - atalho em `settings/stage-required-fields`.

## Como validar

- Criar, renomear e reordenar etapas em `/settings/funnel-stages`.
- Tentar remover etapa com leads e confirmar exigência de realocação no modal.
- Realocar leads e remover etapa; validar contagem e ordem atualizada.
- Tentar remover etapa de sistema e última etapa para validar bloqueios.
