# 60 — Dashboard secundário: conversão, série temporal e mensagens por campanha

## O que foi feito

- No `web/src/app/dashboard/page.tsx` foi adicionado o bloco "Dashboard secundário" com 3 métricas:
  - taxa de conversão entre etapas selecionadas;
  - série temporal de leads criados nos últimos 14 dias;
  - contagem de mensagens enviadas por campanha.
- Fórmula da conversão implementada e exibida na interface:
  - `taxa = (leads na etapa destino / leads na etapa origem) * 100`.
- Os seletores de etapa (origem e destino) são preenchidos dinamicamente com as etapas do workspace.
- Foi criada a camada de dados para mensagens por campanha:
  - `web/src/lib/dashboard/secondary-metrics-service.ts`;
  - `web/src/hooks/use-campaign-message-counts.ts`.
- A contagem de mensagens usa `outreach_events` por `workspace_id`, agrupando em memória por `campaign_id`, com exibição ordenada do maior para o menor total.

## Como validar

- Abrir `/dashboard` e localizar a seção "Dashboard secundário".
- Alterar etapas de origem e destino e confirmar recálculo da taxa.
- Conferir barras e totais da série temporal de leads criados.
- Conferir ranking de mensagens por campanha, incluindo fallback de nome quando campanha não estiver carregada.
