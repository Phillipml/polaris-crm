# 40 — UI de geração de mensagens por lead

## O que foi feito

- Página `web/src/app/leads/[id]/page.tsx` ganhou seção de geração de mensagens.
- Select de campanha ativa (filtra `campaigns.is_active = true` no cliente).
- Botão `Gerar` chama a Edge Function `campaign-generation` e persiste sugestões em `lead_message_suggestions`.
- Botão `Regenerar` faz nova rodada e mantém histórico completo (sem sobrescrever/arquivar).
- Lista de cards com texto completo de cada sugestão, `variant_index` e data.
- Botão `Copiar` por card com toast de feedback.
- Serviço `web/src/lib/lead-message-suggestions/lead-message-suggestions-service.ts` para listar, inserir sugestões e invocar a função.

## Decisão de produto

- Regeneração mantém histórico para auditoria, comparação e rastreabilidade de iterações.
