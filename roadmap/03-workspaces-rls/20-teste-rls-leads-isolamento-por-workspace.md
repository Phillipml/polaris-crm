# 20 - Teste automatizado de RLS para isolamento de leads por workspace

## Ação realizada

Foi adicionado um teste automatizado para validar o isolamento de dados em `leads` com RLS por workspace.

O cenário cobre:

- criação de dois usuários distintos
- criação de um workspace para cada usuário
- inserção de lead no workspace do usuário B
- tentativa do usuário A de listar esse lead mesmo conhecendo `workspace_id` e `lead.id`

O resultado esperado e validado no teste é que o usuário A receba lista vazia, enquanto o usuário B consegue ler normalmente o próprio lead.

Também foi adicionado o script `npm run test:rls` no `web/package.json` e documentação no `web/README.md` com as variáveis necessárias para execução local contra o Supabase.
