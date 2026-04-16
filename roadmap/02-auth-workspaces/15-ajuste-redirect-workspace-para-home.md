# 15 - Ajuste de redirect de workspace para home

## Ação realizada

- Ajustado o fluxo de `/onboarding/workspace` para redirecionar para `/` após:
  - criação de workspace,
  - seleção de workspace existente.
- Ajustado CTA de workspace na área de dashboard para apontar para `/`, mantendo a navegação alinhada ao fluxo atual.

## Resultado

- O fluxo de workspaces passa pela home/auth gate após criar ou selecionar workspace, conforme esperado para esta branch.
