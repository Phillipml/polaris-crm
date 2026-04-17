# 47 — Campanhas: etapa gatilho na UI e persistência

## Entrega

- `CampaignForm`: **Etapa gatilho** como `<select>` editável, opção vazia para `trigger_stage_id` nulo, opção extra quando a etapa salva não existe mais na lista do funil; valor em `CampaignFormValues` e submit.
- `settings/campaigns/new` e `settings/campaigns/[id]`: passam e persistem `trigger_stage_id` via `createCampaign` / `updateCampaign`.
- Textos do fluxo de campanhas e README alinhados à automação por etapa (`supabase/README.md`).

## Escopo de commit sugerido

- `web/src/components/campaigns/CampaignForm.tsx`
- `web/src/app/settings/campaigns/new/page.tsx`
- `web/src/app/settings/campaigns/[id]/page.tsx`
- Serviços/hooks de campanha tocados por `trigger_stage_id` (se houver diff nessa branch)
