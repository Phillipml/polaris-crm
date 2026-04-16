# 41 — Enviar mensagem com evento e transição de etapa

## O que foi feito

- Estratégia escolhida: reutilizar a transição existente (`transition_lead_stage_atomic`) e inserir evento em `outreach_events` no envio.
- Migration `20260417120000_outreach_events_and_stage_slug.sql`:
  - adiciona `slug` em `funnel_stages` com backfill e unicidade por workspace;
  - atualiza seed padrão para slugs (`trying_contact`, etc.);
  - cria tabela `outreach_events` (`lead_id`, `campaign_id`, `message`, `sent_at`, `user_id`, `workspace_id`) com RLS por workspace.
- Serviço `web/src/lib/outreach-events/outreach-events-service.ts`:
  - resolve etapa alvo por `slug='trying_contact'`;
  - registra `outreach_events`;
  - move lead para a etapa com RPC atômica.
- UI em `web/src/app/leads/[id]/page.tsx`:
  - botão `Enviar` em cada card gerado;
  - em sucesso: feedback de envio + atualização local do lead;
  - em bloqueio por campos obrigatórios: mensagem orientando preencher campos ou relaxar requisitos da etapa no seed de demo.

## Resultado

- Envio agora gera trilha de auditoria (`outreach_events`) e avança o lead de forma consistente com regras de etapa.
