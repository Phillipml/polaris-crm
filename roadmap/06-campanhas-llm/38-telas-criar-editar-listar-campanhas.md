# 38 — Telas criar/editar/listar campanhas

## O que foi feito

- Serviço `web/src/lib/campaigns/campaigns-service.ts` com listagem por workspace, leitura por id, create e update via Supabase browser.
- Hooks `useCampaigns`, `useCampaign`, `useCreateCampaign`, `useUpdateCampaign` em `web/src/hooks/use-campaigns.ts`.
- Componente `CampaignForm` com textareas grandes para `context_markdown` e `generation_prompt`, switch de `is_active`, canal, descrição curta; select de etapa gatilho desabilitado com `title` e texto “em breve” (valor existente ainda exibido na edição).
- Rotas: `/settings/campaigns` (lista), `/settings/campaigns/new`, `/settings/campaigns/[id]`; link “Campanhas” no dashboard.
- README atualizado (decisão de UX do gatilho e checklist).

## Observações

- `trigger_stage_id` não é alterado pelo formulário até a branch de automação; criação envia `null`.
- `created_by` preenchido com `auth.getUser()` na criação quando há sessão.
