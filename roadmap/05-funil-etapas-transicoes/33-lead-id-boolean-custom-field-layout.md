# 33 — Layout responsivo para campo custom booleano na página do lead

## Contexto

Em `/leads/[id]`, campos personalizados do tipo booleano usavam dois `<label>` em sequência e `inline-flex` sem container, gerando texto colado ao checkbox (“pet[checkbox] Ativado”) e aparência pouco profissional em telas pequenas.

## O que foi feito

- Seção renomeada para **Campos personalizados**.
- Booleano em linha de grade com `sm:col-span-2`, título em `<span>`, bloco com borda, padding e `flex-col` no mobile / `flex-row` no desktop, checkbox `h-5 w-5` com borda e `accent`, texto auxiliar e estado **Sim, ativado** / **Não, desativado** ligado por `htmlFor` ao input.
- Demais tipos: `htmlFor`/`id` no par label + input e `min-h-11` no input para alvo de toque mais confortável.

## Resultado

O toggle fica legível, com espaçamento consistente e uso correto de label associado ao controle.
