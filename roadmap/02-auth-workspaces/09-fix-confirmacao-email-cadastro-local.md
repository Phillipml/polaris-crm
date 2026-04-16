# 09 - Recuperação de senha unificada por código

## Escopo consolidado

- Fluxo de recuperação concentrado em `/forgot-password` com 3 etapas:
  1. envio de e-mail (`resetPasswordForEmail`)
  2. validação de OTP de 6 dígitos (`verifyOtp`, `type: "recovery"`)
  3. definição de nova senha + `signOut` + retorno para `/login?reset=1`
- Suporte ao fluxo por link do e-mail na mesma página, detectando sessão de recovery e pulando para etapa de nova senha.
- Rota `/auth/reset-password` mantida como redirecionamento compatível para `/forgot-password` (preservando hash/query de links legados).
- Política de senha unificada aplicada nas rotas de cadastro, recuperação e troca de senha.
- Ajustes de `additional_redirect_urls` e `rate_limit` no `supabase/config.toml`, com orientação de Inbucket no ambiente local.

## Resultado

Recuperação de senha ficou previsível e única para usuário, sem depender de múltiplas telas para concluir o reset.
