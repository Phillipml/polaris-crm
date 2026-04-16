# 22 - Configurações de campos do lead por workspace

## Ação realizada

Foi implementada a funcionalidade de gerenciamento de definições de campos customizados do lead em `Configurações → Campos do lead`.

No banco, foi criada a tabela `lead_custom_field_definitions` com:

- `workspace_id`
- `key`
- `label`
- `type`
- unicidade de `key` por workspace (`unique (workspace_id, key)`)

Também foram adicionados índice por `workspace_id`, RLS e policies de `SELECT`, `INSERT`, `UPDATE` e `DELETE` usando `is_workspace_member(workspace_id)`.

No front-end, foram implementados:

- serviço CRUD em `src/lib/lead-custom-fields/lead-custom-field-definitions-service.ts`
- hooks em `src/hooks/use-lead-custom-field-definitions.ts`
- página `src/app/settings/lead-fields/page.tsx` com criar/editar/remover definições

A tela usa o workspace selecionado no onboarding, valida `key` duplicada no client e também respeita a validação de unicidade no banco.
