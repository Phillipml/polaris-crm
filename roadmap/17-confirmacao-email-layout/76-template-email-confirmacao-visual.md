# 76 - Template de e-mail de confirmação alinhado ao recovery

## Objetivo

Dar ao e-mail de confirmação de cadastro a mesma identidade visual do e-mail de recuperação (logo Polaris, fundo cinza, cartão branco, tipografia system-ui).

## Implementação

- Novo arquivo `supabase/templates/confirmation.html`: tabela responsiva, `{{ .SiteURL }}/logoFull.svg`, título **Confirmar cadastro**, texto em português, CTA em botão (`{{ .ConfirmationURL }}`), link em texto para clientes que não renderizam botões, bloco estilizado com `{{ .Token }}` como em `recovery.html`, rodapé de segurança.
- `supabase/config.toml`: seção `[auth.email.template.confirmation]` com assunto `Polaris CRM — confirme seu e-mail` e `content_path = "./supabase/templates/confirmation.html"`.
- `supabase/README.md` e `README.md` raiz atualizados (templates locais e instrução de copiar para **Confirm signup** no projeto hospedado).

## Operação

Após alterar `config.toml`, reiniciar o stack local (`npx supabase@latest stop` e `start`) para o GoTrue recarregar os templates.
