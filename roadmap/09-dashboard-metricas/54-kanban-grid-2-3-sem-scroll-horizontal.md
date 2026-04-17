# 54 — Kanban em grade 2/3 colunas sem scroll horizontal

## Ação

- `web/src/app/dashboard/page.tsx`: o container `#kanban-board` passou de `flex` com `overflow-x-auto` e colunas fixas (`280px`) para `grid grid-cols-2 gap-4 lg:grid-cols-3`, com `min-w-0` nas colunas para o conteúdo respeitar a célula.
- Padrão visual para sete etapas: mobile **2+2+2+1**, a partir de `lg` **3+3+1**.
- Skeleton de loading alinhado: mesma grade e sete placeholders.

## Escopo de commit sugerido

- `web/src/app/dashboard/page.tsx`
- `README.md`
- `roadmap/09-dashboard-metricas/54-kanban-grid-2-3-sem-scroll-horizontal.md`
