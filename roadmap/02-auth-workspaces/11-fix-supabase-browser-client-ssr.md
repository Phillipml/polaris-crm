# 11 - Correção de navegação no header durante nova senha

## Escopo consolidado

- Corrigida fuga de fluxo em `/forgot-password`: clique na logo durante etapas de código/nova senha podia levar para home/dashboard antes de concluir o reset.
- `AuthCard` atualizado para aceitar `logoHref` opcional.
- No fluxo de recuperação:
  - etapa de e-mail mantém logo navegável
  - etapas de código e nova senha removem link da logo

## Resultado

Usuário permanece no fluxo de recuperação até finalizar a troca de senha, evitando saída acidental para área logada.