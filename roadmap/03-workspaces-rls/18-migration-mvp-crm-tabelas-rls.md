# 18 - Migration tabelas MVP CRM com RLS por workspace

## Ação realizada

Foi criada uma nova migration no Supabase para introduzir as tabelas base do CRM com isolamento por tenant:

- `funnel_stages`
- `leads` com `custom_fields jsonb`
- `campaigns`
- `lead_message_suggestions`

Também foi adicionada a função helper:

- `public.is_workspace_member(ws uuid) returns boolean`

Essa função consulta `workspace_members` com `auth.uid()` e passou a ser usada nas policies RLS das tabelas acima.

Para garantir consistência por tenant no banco, a migration inclui FKs compostas com `workspace_id`, por exemplo:

- `leads (stage_id, workspace_id)` -> `funnel_stages (id, workspace_id)`
- `lead_message_suggestions (lead_id, workspace_id)` -> `leads (id, workspace_id)`
- `lead_message_suggestions (campaign_id, workspace_id)` -> `campaigns (id, workspace_id)`

Também foram adicionadas policies de `SELECT`, `INSERT`, `UPDATE` e `DELETE` permitindo acesso apenas quando `workspace_id` pertence a uma membership do usuário autenticado.

No caso de `UPDATE`, foi usado `WITH CHECK (public.is_workspace_member(workspace_id))`, o que impede mover um registro para outro `workspace_id` sem que o usuário pertença ao tenant de destino.
