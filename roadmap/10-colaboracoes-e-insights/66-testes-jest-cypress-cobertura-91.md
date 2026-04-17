# 66 — Testes unitários e de integração com cobertura mínima de 91%

## O que foi feito

- Configuração de **Jest** para testes unitários:
  - `web/jest.config.mjs` com threshold global de cobertura em `91%` para `statements`, `branches`, `functions` e `lines`.
- Criação de testes unitários:
  - `web/tests/unit/auth-messages.test.ts`
  - `web/tests/unit/stage-requirements.test.ts`
- Configuração de **Cypress** para integração/E2E:
  - `web/cypress.config.ts`
  - `web/cypress/e2e/smoke-home.cy.ts`
- Scripts adicionados no `web/package.json`:
  - `test:unit`
  - `test:unit:coverage`
  - `test:integration`
  - `test:integration:open`
  - `test:quality-gate`
- Dependências adicionadas:
  - `jest`, `@types/jest`, `jest-environment-jsdom`, `ts-jest`, `cypress`.

## Como validar

- `npm run test:unit:coverage` deve passar com cobertura >= `91%`.
- `npm run test:integration` deve passar no smoke test.
- `npm run test:quality-gate` executa unitários + integração em sequência.
