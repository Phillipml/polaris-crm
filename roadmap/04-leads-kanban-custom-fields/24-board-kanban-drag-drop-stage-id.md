# 24 - Board Kanban com drag and drop e persistência de stage

## Ação realizada

Foi implementado o board Kanban no `dashboard` usando `@hello-pangea/dnd`.

A entrega inclui:

- leitura das etapas por workspace (`funnel_stages`)
- leitura dos leads por workspace
- cards de lead distribuídos por coluna de etapa
- drag and drop entre colunas com atualização de `stage_id` no banco

Ao soltar o card:

- a UI é atualizada de forma otimista
- se a persistência falhar, a UI é revertida para o estado anterior

Também foi deixado um `TODO` no ponto de drop para validar regras de transição em uma próxima etapa (branch 05).

Arquivos principais:

- `src/app/dashboard/page.tsx`
- `src/hooks/use-funnel-stages.ts`
- `src/lib/funnel-stages/funnel-stages-service.ts`
- `src/lib/supabase/database.types.ts`
