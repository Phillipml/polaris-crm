# 06 - Base de autenticação (login, cadastro e gate inicial)

## Escopo consolidado

- Criação das páginas `/login`, `/register` e `/forgot-password` com formulários acessíveis, estados de loading e feedback de erro.
- Redirecionamento pós-login para `/onboarding/workspace`.
- Home (`/`) convertida em auth gate client-side:
  - com sessão: redireciona para `/dashboard`
  - sem sessão: redireciona para `/login`
- Ajuste de UX no `/login` para posicionar o link "Esqueci minha senha" abaixo do campo de senha.
- Centralização inicial das mensagens amigáveis de auth em `web/src/lib/auth/messages.ts`.

## Resultado

Primeiro fluxo de autenticação funcional de ponta a ponta, com entrada controlada para usuários autenticados e não autenticados.
