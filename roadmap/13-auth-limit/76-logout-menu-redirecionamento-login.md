# 76 - Logout no header: redirecionamento confiável para `/login`

## Problema

Ao clicar em **Sair** no `UserMenu`, o usuário nem sempre era levado à página de login.

## Causa provável

`router.push` e `router.refresh` após `supabase.auth.signOut()` podem não concluir a troca de rota de forma estável no Next.js App Router (estado/cache do cliente), dependendo de timing e de outros listeners de auth.

## Solução

Em `web/src/components/layout/UserMenu.tsx`, após `signOut` (em `try/finally`), chamar `window.location.replace("/login")` para navegação completa e recarga da árvore React, garantindo redirect mesmo se `signOut` falhar parcialmente.

## Arquivos

- `web/src/components/layout/UserMenu.tsx`
- `README.md` (desafio técnico)
- Este roadmap
