# 74 - Rótulos em português para papéis de workspace

## Contexto

Os valores técnicos `owner`, `admin` e `member` apareciam literais na interface, pouco amigáveis para usuários de negócio.

## Ações implementadas

- Função `workspaceRoleLabel` em `web/src/lib/workspaces/workspace-role-label.ts` mapeando `owner` e `admin` para **Administrador** e `member` para **Membro**.
- Uso do helper em onboarding de workspace, membros e convites, filtro de responsáveis no dashboard, seletor de responsável no lead e textos de permissão alinhados em `stage-required-fields`.
- Testes em `web/tests/unit/workspace-role-label.test.ts` e inclusão do arquivo no `collectCoverageFrom` do Jest.

## Resultado

A UI passa a comunicar papéis de forma consistente em português, mantendo os valores originais no banco e nas regras de negócio.
