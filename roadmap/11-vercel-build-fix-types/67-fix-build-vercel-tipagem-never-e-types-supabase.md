# 67 — Fix build Vercel: tipagem `never` e tipos Supabase

## O que foi feito

- Corrigida tipagem em páginas que faziam leitura de membership para evitar inferência `never`:
  - `web/src/app/onboarding/workspace/page.tsx`
  - `web/src/app/settings/stage-required-fields/page.tsx`
  - `web/src/app/settings/workspace-members/page.tsx`
- Ajustado consumo de RPC no onboarding/settings para evitar erro de tipagem durante `next build`.
- Regenerado `web/src/lib/supabase/database.types.ts` a partir do schema local via CLI Supabase.
- Corrigido parâmetro opcional de `delete_funnel_stage` para alinhar com o tipo gerado (`undefined` ao invés de `null`) em:
  - `web/src/lib/funnel-stages/funnel-stages-service.ts`

## Resultado

- `npm run build` em `web` passou com sucesso (mesmo tipo de validação que a Vercel executa no deploy).
