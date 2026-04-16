# 07 - Confirmação de e-mail no cadastro (local)

## Escopo consolidado

- Habilitada confirmação de e-mail no Supabase local em `supabase/config.toml` (`enable_confirmations = true`).
- Fluxo de `/register` ajustado para dois cenários do `signUp`:
  - com sessão imediata: segue para `/onboarding/workspace`
  - sem sessão: redireciona para confirmação pendente
- Criação da página `/email-confirmation-pending` com orientação de validação da conta.
- Documentação do uso do Inbucket (`http://127.0.0.1:54324`) para inspeção dos e-mails em desenvolvimento local.

## Resultado

Cadastro passa a refletir corretamente o comportamento de confirmação de e-mail exigido pelo ambiente local.
