# 73 - Onboarding: perfil de workspace por usuário logado

## Contexto

Convidados como `member` viam na tela de onboarding o papel `owner` para o mesmo workspace, embora o apagar workspace (apenas owner real) se comportasse corretamente no backend.

## Causa raiz

A RLS de `workspace_members` permite que qualquer membro do workspace leia todas as linhas daquele workspace. A query em `/onboarding/workspace` buscava `workspace_id` e `role` sem filtrar `user_id`, retornando uma linha por pessoa. O código deduplicava por `workspace_id` e ficava com a primeira linha ordenada por `created_at` — em geral a do dono.

## Ação implementada

- Em `web/src/app/onboarding/workspace/page.tsx`, o `select` em `workspace_members` passou a incluir `.eq("user_id", session.user.id)` para refletir apenas o papel do usuário autenticado.

## Resultado

Cada usuário vê o perfil correto (`owner`, `admin` ou `member`) por workspace na lista de onboarding.
