# 34 — Booleano custom compacto em tela grande

## Contexto

O bloco booleano usava `sm:col-span-2` com `justify-between`, esticando o texto de ajuda e o checkbox nas pontas opostas em monitores largos e exigindo movimento longo do mouse.

## O que foi feito

- Removido `sm:col-span-2`: o campo ocupa uma célula do grid como os demais.
- Card com `max-w-sm`, controle e rótulo **Sim/Não** na **primeira linha** (`flex items-center gap-3`), texto auxiliar **abaixo** em `text-xs`, sem `justify-between`.

## Resultado

Área de interação concentrada à esquerda, largura máxima ~24rem, leitura e clique próximos.
