# 05 - Migration workspaces, memberships e RLS inicial

## Ação realizada

Foi criada uma nova migration no Supabase para introduzir a base de multi-tenancy:

- Tabela `workspaces` (`id`, `name`, `created_at`)
- Tabela `workspace_members` (`workspace_id`, `user_id`, `role`, `created_at`) com PK composta (`workspace_id`, `user_id`)
- FK de `workspace_members.user_id` para `auth.users.id`

Também foram adicionadas políticas RLS iniciais:

- Usuário autenticado lê apenas memberships próprias (`user_id = auth.uid()`)
- Usuário autenticado pode inserir workspace
- Usuário autenticado pode inserir apenas seu próprio membership inicial com `role = 'owner'`

Para fluxo claro e transacional, foi criada a RPC:

- `create_workspace_with_owner(workspace_name text) returns uuid`

Essa função cria workspace e membership de owner do usuário autenticado na mesma operação.
