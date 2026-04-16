# 30 — Validação na criação de lead (etapa inicial)

## Contexto

Leads criados pelo formulário rápido do dashboard entravam na primeira coluna do Kanban sem cumprir `stage_required_fields` daquela etapa. A RPC `transition_lead_stage_atomic` só valida na mudança de etapa, então o usuário via o card na Base mas só descobria campos faltantes ao arrastar.

## O que foi feito

- Helper `listMissingStageRequirements` em `web/src/lib/stage-required-fields/validate-lead-for-stage-requirements.ts`, espelhando as regras da RPC (campos standard com trim, `owner_user_id`, custom em `custom_fields`).
- No `web/src/app/dashboard/page.tsx`: ao abrir “Novo lead”, carrega obrigatoriedades da etapa inicial (`stages[0]`), mostra inputs extras para standards além de nome/empresa/e-mail e para customs com label das definições do workspace, desabilita salvar enquanto carrega regras ou se o fetch falhar, e bloqueia a criação com a mesma mensagem agregada de campos faltantes antes de chamar `createLead`, enviando também os valores standard/custom no payload do insert.

## Resultado

O lead só é persistido quando já satisfaz as regras da etapa em que nasce, alinhado ao comportamento da transição atômica.
