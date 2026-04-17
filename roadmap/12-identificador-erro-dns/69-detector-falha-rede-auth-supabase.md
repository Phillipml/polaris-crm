# 69 - Detector de falha de rede no auth

## Contexto

Durante validação em produção, o fluxo de autenticação falhava com erros de DNS/rede (`ERR_NAME_NOT_RESOLVED` e `Failed to fetch`), gerando pouca clareza para quem testa.

## Ações implementadas

- Evolução de `getAuthErrorMessage` para aceitar erro em formato `unknown` (string ou objeto `Error`) e mapear falhas de rede/DNS para mensagem dedicada.
- Hardening dos handlers de auth em `login`, `register` e `forgot-password` com `try/catch/finally`, garantindo:
  - liberação de estado de loading mesmo em exceção;
  - exibição de mensagem amigável para falha de conectividade;
  - ausência de travamento visual em botões como `Entrando...`.
- Inclusão de testes unitários para cenários de `Failed to fetch` e objeto `Error` de rede.

## Resultado

O usuário final recebe feedback claro quando o problema é conectividade com Supabase, facilitando troubleshooting em ambientes de avaliação técnica e reduzindo falso diagnóstico de bug na aplicação.
