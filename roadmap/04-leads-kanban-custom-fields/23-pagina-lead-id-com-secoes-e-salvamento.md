# 23 - Página `/leads/[id]` com seções e salvamento

## Ação realizada

Foi implementada a página de detalhe/edição do lead em `src/app/leads/[id]/page.tsx` com as seções:

- dados padrão
- custom fields
- responsável
- observações

A tela carrega o lead pelo `id` e `workspace_id` atual, exibe os custom fields conforme as definições de `lead_custom_field_definitions`, lista membros de `workspace_members` para escolha de responsável e salva alterações em `leads`.

Foram adicionados:

- `getLeadById` em `src/lib/leads/leads-service.ts`
- serviço de membros `src/lib/workspaces/workspace-members-service.ts`
- hook `src/hooks/use-workspace-members.ts`
- tipos de `workspace_members` em `src/lib/supabase/database.types.ts`

O salvamento mostra feedback de sucesso/erro na própria tela.
