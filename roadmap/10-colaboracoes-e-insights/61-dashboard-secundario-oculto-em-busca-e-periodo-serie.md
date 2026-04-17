# 61 — Dashboard secundário oculto na busca e período da série temporal

## O que foi feito

- No `dashboard/page.tsx`, o bloco "Dashboard secundário" agora é ocultado quando há busca textual ativa (`debouncedSearch`), para melhorar foco visual no resultado pesquisado do Kanban.
- Foi adicionado seletor de período da série temporal com opções de `7`, `14` e `30` dias.
- A série temporal passou a recalcular dinamicamente conforme o período selecionado.
- Mantida a lógica de conversão entre etapas e contagem de mensagens por campanha quando não há pesquisa ativa.

## Como validar

- Em `/dashboard`, digitar algo no campo de busca textual e confirmar que o dashboard secundário desaparece.
- Limpar a busca textual e confirmar que o dashboard secundário volta a aparecer.
- Trocar o período entre 7/14/30 dias e confirmar atualização dos dados da série temporal.
