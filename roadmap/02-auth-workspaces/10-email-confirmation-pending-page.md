# 10 - Template de e-mail de recovery (código, PT-BR e logo)

## Escopo consolidado

- Criação e evolução do template `supabase/templates/recovery.html` com foco em OTP (`{{ .Token }}`).
- Assunto de recovery atualizado para PT-BR no `supabase/config.toml`.
- Inclusão de logo no e-mail via `{{ .SiteURL }}/logoFull.svg`.

## Resultado

E-mail de recuperação alinhado ao fluxo por código do app, com texto em português, identidade visual e configuração estável no ambiente local.
