# 31 — Mensagens de campos obrigatórios legíveis no Kanban

## Contexto

Ao falhar o drag and drop ou a criação rápida, a mensagem listava tokens técnicos (`standard:linkedin_url`, `custom:foo`), difíceis para quem não é técnico.

## O que foi feito

- Módulo `web/src/lib/stage-required-fields/lead-field-labels.ts` com mapa de colunas standard em português e função `humanizeMissingRequirementToken`.
- `formatMissingRequirementsMessage` passou a aceitar mapa opcional `key → label` para campos custom (vindo de `lead_custom_field_definitions` no dashboard).
- Dashboard carrega definições de custom com `enabled: Boolean(workspaceId)` para montar esse mapa; o erro de transição reutiliza `formatMissingRequirementsMessage` com os mesmos rótulos da criação rápida.

## Resultado

Exemplo: `Campos obrigatórios faltando: Cargo, LinkedIn` em vez de `standard:job_title, standard:linkedin_url`. Custom sem definição cai em texto `Campo personalizado (chave)`.
