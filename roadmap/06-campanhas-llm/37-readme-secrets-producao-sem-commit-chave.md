# 37 — README: instruções de secrets em produção e aviso de segurança

## Contexto

Precisávamos deixar explícito no README o comando de publicação de secrets para produção e a regra de nunca versionar chaves reais.

## O que foi feito

- `README.md`: seção de secrets para Edge Functions ganhou bloco explícito para produção com:
  - `npx supabase@latest secrets set --env-file supabase/.env`
  - alerta direto de segurança para não commitar `LLM_API_KEY` e outras credenciais.
- `supabase/README.md`: reforço da mesma regra, indicando uso de placeholders em `supabase/.env.example`.

## Resultado

Documentação de operação em produção ficou objetiva e com guardrails de segurança para evitar vazamento de segredos no git.
