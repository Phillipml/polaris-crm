# 12 - Onboarding de workspace: criar ou selecionar (sem convites)

## Ação realizada

- A tela `/onboarding/workspace` deixou de ser estática e passou a carregar os workspaces do usuário autenticado a partir de `workspace_members`.
- Quando o usuário já possui workspaces, a tela lista os itens e permite selecionar um deles para entrar no dashboard.
- A criação de workspace foi conectada à RPC `create_workspace_with_owner(workspace_name)`, garantindo inserção em `workspaces` e `workspace_members` com papel `owner` na mesma operação.
- O workspace escolhido/criado é persistido no browser para continuidade da navegação.
- Não foi implementado fluxo de convites nesta branch.

## Resultado

- Usuário novo cria o primeiro workspace e entra no sistema.
- Usuário com workspaces existentes escolhe um workspace antes de entrar no dashboard.
