# 70 - Timeout de sessão e guard global de autenticação

## Contexto

Como o produto é usado continuamente durante o expediente, foi solicitado reduzir risco de acesso indevido em máquina compartilhada, garantindo logout após inatividade e validação de sessão em navegação/refresh.

## Ações implementadas

- Criação de `SessionGuardian` global em `web/src/components/auth/SessionGuardian.tsx`, injetado no `layout` da aplicação.
- Definição de timeout de inatividade em 120 minutos, com atualização de atividade por interação do usuário (`mousedown`, `keydown`, `scroll`, `touchstart`, `mousemove`) e sincronização entre abas via `localStorage`.
- Verificação contínua de sessão em rotas protegidas; sem sessão válida, redirecionamento imediato para `/login` com parâmetro `next`.
- Logout automático ao exceder inatividade, com redirecionamento para `/login?timeout=1`.
- Tela de login atualizada com feedback explícito quando a sessão expira por inatividade.

## Resultado

O app passa a ter uma camada central de proteção para páginas protegidas, evitando acesso sem sessão após refresh e encerrando sessão ociosa de forma previsível para uso diário em CRM.
