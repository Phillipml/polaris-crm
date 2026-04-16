# 25 - Kanban com empty states, loading skeletons, busca e novo lead

## Ação realizada

Foram implementadas melhorias de usabilidade no board Kanban do dashboard para operação diária:

- botão `Novo lead` habilitado, com formulário rápido e criação direta no banco
- criação inicial do lead na primeira etapa do funil do workspace
- busca simples por nome (`full_name`) para filtrar os cards no board
- empty state quando não há leads no workspace
- empty state quando a busca não encontra resultados
- loading skeletons enquanto stages/leads carregam

No fluxo de drag and drop foi mantido:

- persistência de `stage_id` ao soltar card
- rollback da UI em caso de falha
- `TODO` para validações de transição na branch 05
