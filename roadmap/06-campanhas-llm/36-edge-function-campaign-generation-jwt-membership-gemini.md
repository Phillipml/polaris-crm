# 36 — Edge Function campaign-generation com JWT, membership e Gemini

## Contexto

Precisávamos sair do stub e entregar geração HTTP autenticada por campanha/lead, respeitando multi-tenancy e retornando payload estável para o app.

## O que foi feito

- `supabase/functions/campaign-generation/index.ts` implementado com `POST`:
  - leitura de `Authorization: Bearer <token>`
  - validação de JWT via Supabase Auth (`401` em token inválido/ausente)
  - busca do lead para resolver `workspace_id`
  - validação de membership em `workspace_members` (`403`)
  - carga de campanha no mesmo workspace e lead/custom fields (`404` quando não encontrado)
  - montagem de prompt em blocos `CONTEXTO`, `INSTRUCOES`, `DADOS DO LEAD`
  - chamada ao Google Gemini com `responseMimeType: application/json` e schema exigindo `{ "messages": string[] }` com 2–3 mensagens
- `supabase/functions/campaign-generation/deno.json` atualizado com import map para `@supabase/supabase-js`.
- README e `supabase/README.md` atualizados para refletir a implementação real (não mais stub).

## Resultado

A função já executa fluxo completo de autenticação, autorização por workspace e geração de mensagens com retorno JSON consistente para consumo pelo front.
