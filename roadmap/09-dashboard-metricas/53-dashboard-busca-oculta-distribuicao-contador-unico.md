# 53 — Dashboard: busca oculta distribuição e contador único

## Ação

- `web/src/app/dashboard/page.tsx`: ao filtrar leads por nome (campo de busca com texto), a seção **Distribuição por etapa** deixa de ser renderizada para dar foco ao Kanban filtrado.
- Removidos os cards individuais por etapa que duplicavam os mesmos números das barras; permanece um único card de total (sem busca: total do workspace; com busca: quantidade visível e linha **de N no workspace**).

## Escopo de commit sugerido

- `web/src/app/dashboard/page.tsx`
- `README.md`
- `roadmap/09-dashboard-metricas/53-dashboard-busca-oculta-distribuicao-contador-unico.md`
