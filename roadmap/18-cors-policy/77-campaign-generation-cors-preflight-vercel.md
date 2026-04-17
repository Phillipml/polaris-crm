# 77 — CORS e OPTIONS na Edge campaign-generation (Vercel)

## Problema

Chamadas de `https://polaris-crm.vercel.app` para `functions/v1/campaign-generation` falhavam no preflight: resposta sem `Access-Control-Allow-Origin` e `OPTIONS` não tratado (405 sem headers CORS).

## Solução

Em `supabase/functions/campaign-generation/index.ts`: mesmos cabeçalhos CORS que `accept-invite`, resposta **204** para **OPTIONS**, e inclusão dos headers CORS em todas as respostas JSON.

## Deploy

`npx supabase@latest functions deploy campaign-generation` no projeto linkado.
