# 71 - Atualização de testes de auth para falhas de rede e DNS

## Contexto

Após adicionar o detector de falhas de conectividade no fluxo de autenticação, a suíte unitária precisava refletir os novos cenários de erro.

## Ações implementadas

- Expansão de `web/tests/unit/auth-messages.test.ts` com casos adicionais para:
  - erro `ERR_NAME_NOT_RESOLVED` (DNS);
  - fallback quando o erro recebido não possui `message`.
- Mantidos os cenários já existentes de `Failed to fetch` e erro nativo de rede.

## Resultado

A cobertura de mensagens de autenticação agora valida explicitamente os cenários de conectividade mais críticos em produção, evitando regressão no tratamento de erros para avaliadores e usuários finais.
