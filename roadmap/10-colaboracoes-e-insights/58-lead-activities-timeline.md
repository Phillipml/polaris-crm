# 58 — `lead_activities`, trigger de etapa e timeline no detalhe do lead

## O que foi feito

- Migration `supabase/migrations/20260418210000_lead_activities_timeline.sql`: tabela `public.lead_activities` (`workspace_id`, `lead_id`, `type` com check, `payload` jsonb, `created_by`, `created_at`), índice por workspace/lead/data, RLS (`select`/`insert` para `authenticated` com `is_workspace_member`), trigger `trg_leads_stage_change_activity` após `UPDATE` em `leads` quando `stage_id` muda inserindo `stage_changed`.
- Serviço `web/src/lib/lead-activities/lead-activities-service.ts`: listagem, insert de `outreach_sent`, diff de campos rastreados e insert de `fields_updated`.
- `updateLead` em `leads-service.ts`: leitura do estado anterior, `update`, comparação e insert de `fields_updated` quando há mudanças em campos padrão, responsável, observações ou `custom_fields`.
- `sendOutreachAndMoveLead`: após transição bem-sucedida, insert de `outreach_sent` com prévia da mensagem e `campaign_id`.
- Tipos em `web/src/lib/supabase/database.types.ts` para `lead_activities`.
- UI: componente `LeadActivitiesTimeline` e integração na página `web/src/app/leads/[id]/page.tsx` (grade responsiva, recarga quando `lead.updated_at` muda).

## Como validar

- Aplicar migrações no Supabase local ou remoto, abrir um lead, salvar alterações e conferir entradas `fields_updated` e ordem na timeline.
- Mover lead de etapa (Kanban ou envio simulado) e conferir `stage_changed` e, no envio, `outreach_sent`.
