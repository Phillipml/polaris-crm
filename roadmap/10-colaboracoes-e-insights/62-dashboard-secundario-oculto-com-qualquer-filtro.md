# 62 — Dashboard secundário oculto com qualquer filtro ativo

## O que foi feito

- Ajuste no `web/src/app/dashboard/page.tsx` para ocultar o bloco "Dashboard secundário" quando houver qualquer filtro ativo no Kanban:
  - busca textual;
  - filtro por responsável;
  - filtro por etapa.
- Antes, o bloco era ocultado apenas quando havia busca textual.

## Como validar

- Em `/dashboard`, aplicar filtro por responsável e confirmar que o dashboard secundário some.
- Aplicar filtro por etapa e confirmar que o dashboard secundário some.
- Limpar todos os filtros e confirmar que o dashboard secundário volta.
