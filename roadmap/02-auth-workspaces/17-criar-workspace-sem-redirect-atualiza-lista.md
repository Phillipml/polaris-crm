# 17 - Criar workspace sem redirect e atualizar lista

## Ação realizada

- Ajustado fluxo de criação em `/onboarding/workspace` para não redirecionar automaticamente após sucesso.
- Após criar, o novo workspace é adicionado imediatamente ao estado local da lista com perfil `owner`.
- Mensagem de sucesso atualizada para orientar seleção manual do workspace na lista.

## Resultado

- Usuário permanece na tela de onboarding após criar workspace.
- Lista de workspaces é atualizada em tempo real com o item recém-criado.
